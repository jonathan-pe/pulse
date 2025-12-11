import { prisma } from '@/lib/db'
import { createLogger } from '../lib/logger'
import type { PredictionType } from '@/lib/db'
import { oddsAggregationService } from './odds-aggregation.service'
import type { OddsSnapshot } from './points.service'

import { DEFAULT_DAILY_BONUS_TIER_LIMIT, DEFAULT_DAILY_TOTAL_LIMIT, DAILY_RESET_HOUR_UTC } from '@pulse/shared'

const logger = createLogger('PredictionsService')

// Constants from business rules (using shared defaults)
const DAILY_BONUS_LIMIT = DEFAULT_DAILY_BONUS_TIER_LIMIT
const DAILY_TOTAL_LIMIT = DEFAULT_DAILY_TOTAL_LIMIT

export interface CreatePredictionInput {
  userId: string
  gameId: string
  type: PredictionType
  pick: string
}

export interface PredictionValidationError {
  field: string
  message: string
}

export interface CreatePredictionsResult {
  created: Array<{
    id: string
    gameId: string
    type: PredictionType
    pick: string
    createdAt: Date
  }>
  errors: Array<{
    gameId: string
    error: string
  }>
  dailyStats: {
    totalToday: number
    totalRemaining: number
  }
}

/**
 * PredictionsService - Handles all prediction-related business logic
 */
export class PredictionsService {
  /**
   * Get the start of the current day based on DAILY_RESET_HOUR_UTC
   *
   * Default: 10am UTC (5am ET / 2am PT)
   * This determines when daily stats and predictions reset.
   */
  private getStartOfDay(): Date {
    const now = new Date()
    const resetToday = new Date(now)
    resetToday.setUTCHours(DAILY_RESET_HOUR_UTC, 0, 0, 0)

    // If current time is before today's reset, use yesterday's reset
    if (now < resetToday) {
      resetToday.setDate(resetToday.getDate() - 1)
    }

    return resetToday
  }

  /**
   * Get daily prediction stats for a user
   */
  async getDailyStats(userId: string) {
    const startOfDay = this.getStartOfDay()

    const totalToday = await prisma.prediction.count({
      where: {
        userId,
        createdAt: { gte: startOfDay },
      },
    })

    return {
      totalToday,
      totalRemaining: Math.max(0, DAILY_TOTAL_LIMIT - totalToday),
    }
  }

  /**
   * Check if a game status indicates the game has started or finished
   * Uses case-insensitive comparison to handle various API responses
   */
  private isGameInProgress(status: string): boolean {
    const normalizedStatus = status.toLowerCase().trim()

    // Only 'scheduled' means the game hasn't started
    if (normalizedStatus === 'scheduled') {
      return false
    }

    // Any other status means the game has started or finished
    return true
  }

  /**
   * Validate a single prediction before creation
   */
  async validatePrediction(input: CreatePredictionInput): Promise<PredictionValidationError | null> {
    // 1. Check if game exists
    const game = await prisma.game.findUnique({
      where: { id: input.gameId },
      select: {
        id: true,
        startsAt: true,
        status: true,
        result: {
          select: {
            id: true,
            homeScore: true,
            awayScore: true,
          },
        },
      },
    })

    if (!game) {
      return { field: 'gameId', message: 'Game not found' }
    }

    // 2. Check if game has a result (game is finished)
    // This is the most reliable check - if there's a result, the game is definitely over
    if (game.result) {
      return { field: 'gameId', message: 'Game has already finished' }
    }

    // 3. Check game status (case-insensitive)
    if (this.isGameInProgress(game.status)) {
      return { field: 'gameId', message: 'Game has already started or finished' }
    }

    // 4. Check if game start time has passed
    if (new Date(game.startsAt) <= new Date()) {
      return { field: 'gameId', message: 'Game has already started' }
    }

    // 2. Check for exact duplicate prediction (same game, type, and pick)
    const exactDuplicate = await prisma.prediction.findFirst({
      where: {
        userId: input.userId,
        gameId: input.gameId,
        type: input.type,
        pick: input.pick,
      },
    })

    if (exactDuplicate) {
      return { field: 'pick', message: 'You already have this exact prediction' }
    }

    // 3. Validate pick format based on type
    const pickValidation = this.validatePickFormat(input.type, input.pick)
    if (pickValidation) {
      return pickValidation
    }

    return null
  }

  /**
   * Validate pick format based on prediction type
   */
  private validatePickFormat(type: PredictionType, pick: string): PredictionValidationError | null {
    switch (type) {
      case 'MONEYLINE':
        // Pick should be "home" or "away"
        if (pick !== 'home' && pick !== 'away') {
          return { field: 'pick', message: 'Moneyline pick must be "home" or "away"' }
        }
        break

      case 'SPREAD':
        // Pick should be "home" or "away" (the team covering the spread)
        if (pick !== 'home' && pick !== 'away') {
          return { field: 'pick', message: 'Spread pick must be "home" or "away"' }
        }
        break

      case 'TOTAL':
        // Pick should be "over" or "under"
        if (pick !== 'over' && pick !== 'under') {
          return { field: 'pick', message: 'Total pick must be "over" or "under"' }
        }
        break

      default:
        return { field: 'type', message: 'Invalid prediction type' }
    }

    return null
  }

  /**
   * Get the opposite pick for a given prediction type and pick
   * Used to detect contradicting predictions
   */
  private getOppositePick(type: PredictionType, pick: string): string | null {
    switch (type) {
      case 'MONEYLINE':
      case 'SPREAD':
        return pick === 'home' ? 'away' : pick === 'away' ? 'home' : null
      case 'TOTAL':
        return pick === 'over' ? 'under' : pick === 'under' ? 'over' : null
      default:
        return null
    }
  }

  /**
   * Check if a contradicting prediction exists and delete it
   * Returns true if a contradicting prediction was deleted
   */
  private async handleContradictingPrediction(input: CreatePredictionInput): Promise<boolean> {
    const oppositePick = this.getOppositePick(input.type, input.pick)
    if (!oppositePick) return false

    const contradicting = await prisma.prediction.findFirst({
      where: {
        userId: input.userId,
        gameId: input.gameId,
        type: input.type,
        pick: oppositePick,
      },
    })

    if (contradicting) {
      await prisma.prediction.delete({
        where: { id: contradicting.id },
      })
      logger.info('Replaced contradicting prediction', {
        oldPredictionId: contradicting.id,
        userId: input.userId,
        gameId: input.gameId,
        type: input.type,
        oldPick: oppositePick,
        newPick: input.pick,
      })
      return true
    }

    return false
  }

  /**
   * Create a single prediction
   */
  async createPrediction(input: CreatePredictionInput) {
    // Validate the prediction
    const validationError = await this.validatePrediction(input)
    if (validationError) {
      throw new Error(validationError.message)
    }

    // Check for and handle contradicting predictions
    const replacedContradiction = await this.handleContradictingPrediction(input)

    // Check daily limits only if we're NOT replacing a contradicting prediction
    if (!replacedContradiction) {
      const stats = await this.getDailyStats(input.userId)
      if (stats.totalRemaining <= 0) {
        throw new Error('Daily prediction limit reached (100)')
      }
    }

    // Fetch current odds for this game
    const gameOdds = await prisma.gameOdds.findMany({
      where: { gameId: input.gameId },
    })

    const unifiedOdds = oddsAggregationService.aggregateOdds(gameOdds)
    const oddsSnapshot: OddsSnapshot = {
      moneyline: unifiedOdds.moneyline ?? undefined,
      spread: unifiedOdds.spread ?? undefined,
      total: unifiedOdds.total ?? undefined,
    }

    // Determine if this is a bonus tier prediction (first of the day)
    const startOfDay = this.getStartOfDay()
    const todaysPredictions = await prisma.prediction.count({
      where: {
        userId: input.userId,
        createdAt: { gte: startOfDay },
      },
    })

    const isBonusTier = todaysPredictions < DAILY_BONUS_LIMIT

    // Create the prediction with odds snapshot and bonus tier flag
    const prediction = await prisma.prediction.create({
      data: {
        userId: input.userId,
        gameId: input.gameId,
        type: input.type,
        pick: input.pick,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        oddsAtPrediction: oddsSnapshot as any,
        bonusTier: isBonusTier,
      },
    })

    logger.info('Prediction created', {
      predictionId: prediction.id,
      userId: input.userId,
      gameId: input.gameId,
      type: input.type,
      bonusTier: isBonusTier,
      replaced: replacedContradiction,
    })

    return prediction
  }

  /**
   * Create multiple predictions at once (batch operation)
   * Validates each prediction and returns both successes and errors
   */
  async createPredictions(
    userId: string,
    inputs: Omit<CreatePredictionInput, 'userId'>[]
  ): Promise<CreatePredictionsResult> {
    const created: CreatePredictionsResult['created'] = []
    const errors: CreatePredictionsResult['errors'] = []

    // Get current stats
    const initialStats = await this.getDailyStats(userId)
    let totalCreatedInBatch = 0
    let totalReplacedInBatch = 0

    // Process each prediction
    for (const input of inputs) {
      // Check if we've hit limits during this batch (excluding replacements)
      const currentTotal = initialStats.totalToday + totalCreatedInBatch - totalReplacedInBatch
      if (currentTotal >= DAILY_TOTAL_LIMIT) {
        errors.push({
          gameId: input.gameId,
          error: 'Daily prediction limit reached (100)',
        })
        continue
      }

      try {
        // Validate the prediction
        const validationError = await this.validatePrediction({ ...input, userId })
        if (validationError) {
          errors.push({
            gameId: input.gameId,
            error: validationError.message,
          })
          continue
        }

        // Check for and handle contradicting predictions
        const replacedContradiction = await this.handleContradictingPrediction({ ...input, userId })
        if (replacedContradiction) {
          totalReplacedInBatch++
        }

        // Fetch current odds for this game
        const gameOdds = await prisma.gameOdds.findMany({
          where: { gameId: input.gameId },
        })

        const unifiedOdds = oddsAggregationService.aggregateOdds(gameOdds)
        const oddsSnapshot: OddsSnapshot = {
          moneyline: unifiedOdds.moneyline ?? undefined,
          spread: unifiedOdds.spread ?? undefined,
          total: unifiedOdds.total ?? undefined,
        }

        // Determine if this is a bonus tier prediction
        const currentDailyCount = initialStats.totalToday + totalCreatedInBatch - totalReplacedInBatch
        const isBonusTier = currentDailyCount < DAILY_BONUS_LIMIT

        // Create the prediction with odds snapshot and bonus tier flag
        const prediction = await prisma.prediction.create({
          data: {
            userId,
            gameId: input.gameId,
            type: input.type,
            pick: input.pick,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            oddsAtPrediction: oddsSnapshot as any,
            bonusTier: isBonusTier,
          },
        })

        created.push({
          id: prediction.id,
          gameId: prediction.gameId,
          type: prediction.type,
          pick: prediction.pick,
          createdAt: prediction.createdAt,
        })

        totalCreatedInBatch++

        logger.info('Prediction created in batch', {
          predictionId: prediction.id,
          userId,
          gameId: input.gameId,
          type: input.type,
          replaced: replacedContradiction,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        errors.push({
          gameId: input.gameId,
          error: message,
        })
        logger.warn('Failed to create prediction in batch', { userId, gameId: input.gameId, error: message })
      }
    }

    // Get final stats
    const finalStats = await this.getDailyStats(userId)

    return {
      created,
      errors,
      dailyStats: finalStats,
    }
  }

  /**
   * Get all predictions for a user
   */
  async getUserPredictions(userId: string, options?: { pending?: boolean }) {
    const where: { userId: string; lockedAt?: null } = { userId }

    if (options?.pending) {
      where.lockedAt = null
    }

    const predictions = await prisma.prediction.findMany({
      where,
      select: {
        id: true,
        gameId: true,
        type: true,
        pick: true,
        createdAt: true,
        lockedAt: true,
        bonusTier: true,
        isCorrect: true,
        processedAt: true,
        oddsAtPrediction: true,
        game: {
          select: {
            id: true,
            homeTeam: true,
            awayTeam: true,
            startsAt: true,
            league: true,
            result: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Fetch points earned for each prediction from the ledger
    // Points are stored in PointsLedger with meta.predictionId
    const predictionIds = predictions.map((p) => p.id)
    const pointsLedgerEntries = await prisma.pointsLedger.findMany({
      where: {
        userId,
      },
      select: {
        delta: true,
        meta: true,
      },
    })

    // Create a map of predictionId -> points earned
    const pointsMap = new Map<string, number>()
    for (const entry of pointsLedgerEntries) {
      const meta = entry.meta as { predictionId?: string } | null
      if (meta?.predictionId && predictionIds.includes(meta.predictionId)) {
        pointsMap.set(meta.predictionId, entry.delta)
      }
    }

    // Add pointsEarned to each prediction
    return predictions.map((prediction) => ({
      ...prediction,
      pointsEarned: pointsMap.get(prediction.id) ?? null,
    }))
  }

  /**
   * Get game IDs that a user has already predicted on
   * Returns an array for API serialization
   */
  async getUserPredictedGameIds(userId: string): Promise<string[]> {
    const predictions = await prisma.prediction.findMany({
      where: { userId },
      select: { gameId: true },
    })

    return predictions.map((p) => p.gameId)
  }

  /**
   * Lock predictions for a game when it starts
   * This should be called when a game's status changes to in-progress
   */
  async lockPredictionsForGame(gameId: string) {
    const result = await prisma.prediction.updateMany({
      where: {
        gameId,
        lockedAt: null,
      },
      data: {
        lockedAt: new Date(),
      },
    })

    logger.info('Locked predictions for game', { gameId, count: result.count })
    return result
  }

  /**
   * Determine if a prediction qualifies for bonus tier at scoring time
   * Returns true if this prediction was in the first DAILY_BONUS_LIMIT predictions for the day
   * This should be called when calculating points for a correct prediction
   */
  async isBonusTierPrediction(predictionId: string): Promise<boolean> {
    const prediction = await prisma.prediction.findUnique({
      where: { id: predictionId },
      select: {
        userId: true,
        createdAt: true,
      },
    })

    if (!prediction) {
      return false
    }

    // Get start of the day for this prediction
    const startOfDay = new Date(prediction.createdAt)
    startOfDay.setUTCHours(0, 0, 0, 0)

    const endOfDay = new Date(startOfDay)
    endOfDay.setUTCHours(23, 59, 59, 999)

    // Count how many predictions were made before this one on the same day
    const earlierPredictionsCount = await prisma.prediction.count({
      where: {
        userId: prediction.userId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
          lt: prediction.createdAt, // Strictly before this prediction
        },
      },
    })

    // If this is within the first DAILY_BONUS_LIMIT predictions, it's bonus tier
    return earlierPredictionsCount < DAILY_BONUS_LIMIT
  }
}

// Export singleton instance
export const predictionsService = new PredictionsService()
