import { prisma } from '@/lib/db'
import { createLogger } from '../lib/logger'
import type { PredictionType } from '@/lib/db'
import { oddsAggregationService } from './odds-aggregation.service'
import type { OddsSnapshot } from './points.service'
import { PredictionRejectedError } from '../lib/api-errors'

import { DAILY_RESET_HOUR_UTC } from '@pulse/shared'

const logger = createLogger('PredictionsService')

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
    code?: string
  }>
  dailyStats: {
    totalToday: number
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
   * Count predictions created since the current daily reset (for stats / UI)
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
   * Validate a single prediction before creation.
   * @param forParlayLeg — when true, skips standalone duplicate-prediction check (parlay legs use `ParlayLeg` rows only).
   */
  async validatePrediction(
    input: CreatePredictionInput,
    options?: { forParlayLeg?: boolean; skipUserConflictChecks?: boolean }
  ): Promise<PredictionValidationError | null> {
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

    if (!options?.skipUserConflictChecks) {
      const pendingParlayLeg = await prisma.parlayLeg.findFirst({
        where: {
          gameId: input.gameId,
          type: input.type,
          pick: input.pick,
          parlay: { userId: input.userId, status: 'PENDING' },
        },
      })
      if (pendingParlayLeg) {
        throw new PredictionRejectedError(
          'MARKET_ALREADY_IN_PARLAY',
          'This market is already used on a pending parlay ticket.'
        )
      }
    }

    if (!options?.forParlayLeg) {
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

    await this.handleContradictingPrediction(input)

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

    const prediction = await prisma.prediction.create({
      data: {
        userId: input.userId,
        gameId: input.gameId,
        type: input.type,
        pick: input.pick,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        oddsAtPrediction: oddsSnapshot as any,
      },
    })

    logger.info('Prediction created', {
      predictionId: prediction.id,
      userId: input.userId,
      gameId: input.gameId,
      type: input.type,
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

    for (const input of inputs) {
      try {
        const validationError = await this.validatePrediction({ ...input, userId })
        if (validationError) {
          errors.push({
            gameId: input.gameId,
            error: validationError.message,
          })
          continue
        }

        await this.handleContradictingPrediction({ ...input, userId })

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

        const prediction = await prisma.prediction.create({
          data: {
            userId,
            gameId: input.gameId,
            type: input.type,
            pick: input.pick,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            oddsAtPrediction: oddsSnapshot as any,
          },
        })

        created.push({
          id: prediction.id,
          gameId: prediction.gameId,
          type: prediction.type,
          pick: prediction.pick,
          createdAt: prediction.createdAt,
        })

        logger.info('Prediction created in batch', {
          predictionId: prediction.id,
          userId,
          gameId: input.gameId,
          type: input.type,
        })
      } catch (error) {
        if (error instanceof PredictionRejectedError) {
          errors.push({
            gameId: input.gameId,
            error: error.message,
            code: error.code,
          })
          continue
        }
        const message = error instanceof Error ? error.message : 'Unknown error'
        errors.push({
          gameId: input.gameId,
          error: message,
        })
        logger.warn('Failed to create prediction in batch', { userId, gameId: input.gameId, error: message })
      }
    }

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
        outcome: true,
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
}

// Export singleton instance
export const predictionsService = new PredictionsService()
