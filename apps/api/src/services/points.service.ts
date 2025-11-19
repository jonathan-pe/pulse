import { prisma } from '@pulse/db'
import type { PredictionType } from '@pulse/db'
import { createLogger } from '../lib/logger'
import { calculateTotalPoints, applyDiminishingReturns } from '../utils/points-calculation'

const logger = createLogger('PointsService')

export interface OddsSnapshot {
  moneyline?: { home: number; away: number }
  spread?: { value: number; homePrice?: number; awayPrice?: number }
  total?: { value: number; overPrice?: number; underPrice?: number }
}

export interface PredictionWithGame {
  id: string
  userId: string
  gameId: string
  type: PredictionType
  pick: string
  oddsAtPrediction: OddsSnapshot | null
  bonusTier: boolean
  isCorrect: boolean | null
  game: {
    result: {
      homeScore: number
      awayScore: number
    } | null
  }
}

export interface ScoringResult {
  predictionId: string
  isCorrect: boolean
  pointsAwarded: number
  streakBefore: number
  streakAfter: number
}

/**
 * PointsService - Handles point calculation and awarding for predictions
 */
export class PointsService {
  /**
   * Determine if a prediction is correct based on game result
   *
   * @param prediction - Prediction with type, pick, and game result
   * @returns true if prediction was correct, false otherwise
   */
  isPredictionCorrect(prediction: PredictionWithGame): boolean {
    const result = prediction.game.result
    if (!result) {
      throw new Error(`Game ${prediction.gameId} has no result`)
    }

    const { homeScore, awayScore } = result
    const { type, pick } = prediction

    switch (type) {
      case 'MONEYLINE': {
        // Simple: did the picked team win?
        const homeWon = homeScore > awayScore
        const awayWon = awayScore > homeScore
        const tie = homeScore === awayScore

        if (tie) {
          // Ties are treated as incorrect (push in betting terms)
          logger.debug('Moneyline prediction resulted in tie', { predictionId: prediction.id })
          return false
        }

        if (pick === 'home') return homeWon
        if (pick === 'away') return awayWon
        throw new Error(`Invalid moneyline pick: ${pick}`)
      }

      case 'SPREAD': {
        // Check if team covered the spread
        const oddsData = prediction.oddsAtPrediction
        const spread = oddsData?.spread?.value

        if (spread === undefined || spread === null) {
          throw new Error(`No spread data for prediction ${prediction.id}`)
        }

        // Spread is from home team's perspective
        // Negative spread = home is favored, must win by more than |spread|
        // Positive spread = away is favored, home gets points
        const homeScoreWithSpread = homeScore + spread
        const homeCovered = homeScoreWithSpread > awayScore
        const awayCovered = awayScore > homeScoreWithSpread
        const push = homeScoreWithSpread === awayScore

        if (push) {
          logger.debug('Spread prediction resulted in push', { predictionId: prediction.id })
          return false
        }

        if (pick === 'home') return homeCovered
        if (pick === 'away') return awayCovered
        throw new Error(`Invalid spread pick: ${pick}`)
      }

      case 'TOTAL': {
        // Check if total went over or under
        const oddsData = prediction.oddsAtPrediction
        const total = oddsData?.total?.value

        if (total === undefined || total === null) {
          throw new Error(`No total data for prediction ${prediction.id}`)
        }

        const actualTotal = homeScore + awayScore
        const isOver = actualTotal > total
        const isUnder = actualTotal < total
        const push = actualTotal === total

        if (push) {
          logger.debug('Total prediction resulted in push', { predictionId: prediction.id })
          return false
        }

        if (pick === 'over') return isOver
        if (pick === 'under') return isUnder
        throw new Error(`Invalid total pick: ${pick}`)
      }

      default:
        throw new Error(`Unknown prediction type: ${type}`)
    }
  }

  /**
   * Calculate points for a correct prediction
   *
   * @param prediction - Prediction with odds and bonus tier status
   * @param currentStreak - User's current streak before this prediction
   * @param dailyPredictionCount - Number of predictions made today (for diminishing returns)
   * @returns Points to award (after all bonuses and modifiers)
   */
  calculatePoints(prediction: PredictionWithGame, currentStreak: number, dailyPredictionCount: number): number {
    const oddsData = prediction.oddsAtPrediction
    if (!oddsData) {
      throw new Error(`No odds data for prediction ${prediction.id}`)
    }

    // Extract the relevant odds based on prediction type
    let odds: number

    switch (prediction.type) {
      case 'MONEYLINE': {
        const pickSide = prediction.pick === 'home' ? 'home' : 'away'
        odds = oddsData.moneyline?.[pickSide] ?? 0
        if (odds === 0) {
          throw new Error(`No moneyline odds for ${pickSide} in prediction ${prediction.id}`)
        }
        break
      }
      case 'SPREAD': {
        // Use the spread price if available, otherwise estimate from spread value
        const pickSide = prediction.pick === 'home' ? 'homePrice' : 'awayPrice'
        odds = oddsData.spread?.[pickSide] ?? -110 // Default to -110 if no price
        break
      }
      case 'TOTAL': {
        // Use over/under price if available
        const pickSide = prediction.pick === 'over' ? 'overPrice' : 'underPrice'
        odds = oddsData.total?.[pickSide] ?? -110 // Default to -110 if no price
        break
      }
      default:
        throw new Error(`Unknown prediction type: ${prediction.type}`)
    }

    if (odds === undefined || odds === null) {
      throw new Error(`Could not extract odds for prediction ${prediction.id}`)
    }

    // Calculate base points + streak bonus
    const rawPoints = calculateTotalPoints(odds, currentStreak, prediction.bonusTier)

    // Apply diminishing returns based on daily volume
    const finalPoints = applyDiminishingReturns(rawPoints, dailyPredictionCount)

    logger.debug('Calculated points', {
      predictionId: prediction.id,
      odds,
      currentStreak,
      dailyPredictionCount,
      rawPoints,
      finalPoints,
      bonusTier: prediction.bonusTier,
    })

    return Math.round(finalPoints) // Round to nearest integer
  }

  /**
   * Award points to a user by creating a ledger entry
   *
   * @param userId - User to award points to
   * @param delta - Points to award (positive integer)
   * @param reason - Human-readable reason for the points
   * @param meta - Additional metadata (prediction ID, game info, etc.)
   */
  async awardPoints(userId: string, delta: number, reason: string, meta?: Record<string, unknown>): Promise<void> {
    await prisma.pointsLedger.create({
      data: {
        userId,
        delta,
        reason,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        meta: (meta ?? {}) as any,
      },
    })

    logger.info('Points awarded', { userId, delta, reason })
  }

  /**
   * Update user's streak based on prediction correctness
   *
   * @param userId - User ID
   * @param isCorrect - Whether the prediction was correct
   * @param isBonusTier - Whether this was a bonus tier prediction
   * @returns New streak value
   */
  async updateUserStreak(userId: string, isCorrect: boolean, isBonusTier: boolean): Promise<number> {
    // Only bonus tier predictions affect streak
    if (!isBonusTier) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { currentStreak: true },
      })
      return user?.currentStreak ?? 0
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { currentStreak: true },
    })

    const currentStreak = user?.currentStreak ?? 0

    if (isCorrect) {
      // Increment streak
      const newStreak = currentStreak + 1
      await prisma.user.update({
        where: { id: userId },
        data: { currentStreak: newStreak },
      })
      logger.debug('Streak incremented', { userId, from: currentStreak, to: newStreak })
      return newStreak
    } else {
      // Reset streak
      if (currentStreak > 0) {
        await prisma.user.update({
          where: { id: userId },
          data: { currentStreak: 0 },
        })
        logger.debug('Streak reset', { userId, from: currentStreak })
      }
      return 0
    }
  }

  /**
   * Get user's current total points from ledger
   *
   * @param userId - User ID
   * @returns Total points
   */
  async getUserPoints(userId: string): Promise<number> {
    const result = await prisma.pointsLedger.aggregate({
      where: { userId },
      _sum: { delta: true },
    })

    return result._sum.delta ?? 0
  }

  /**
   * Get count of predictions made today by user (for diminishing returns)
   *
   * @param userId - User ID
   * @param beforeTimestamp - Count predictions created before this time
   * @returns Number of predictions made today
   */
  async getDailyPredictionCount(userId: string, beforeTimestamp: Date): Promise<number> {
    const startOfDay = new Date(beforeTimestamp)
    startOfDay.setUTCHours(0, 0, 0, 0)

    const count = await prisma.prediction.count({
      where: {
        userId,
        createdAt: {
          gte: startOfDay,
          lt: beforeTimestamp,
        },
      },
    })

    return count
  }
}

// Export singleton instance
export const pointsService = new PointsService()
