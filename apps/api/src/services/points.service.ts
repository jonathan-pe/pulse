import { prisma } from '@/lib/db'
import type { PredictionType } from '@/lib/db'
import type { LeagueStats, UserStats } from '@pulse/types'
import { createLogger } from '../lib/logger'
import {
  calculateTotalPoints,
  applyDiminishingReturns,
  calculateIncorrectPoints,
  DAILY_RESET_HOUR_UTC,
} from '@pulse/shared'

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
    league: string
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
   * Calculate points for a prediction (correct or incorrect)
   *
   * For correct predictions:
   * - Pure probability-based scoring with bonus tier multiplier (1.5x for first pick/day)
   * - Applies diminishing returns based on daily volume
   *
   * For incorrect predictions:
   * - Negative points scaled by probability (favorites cost more than underdogs)
   * - No tier multiplier or diminishing returns applied to losses
   *
   * @param prediction - Prediction with odds and bonus tier status
   * @param dailyPredictionCount - Number of predictions made today (for diminishing returns)
   * @param isCorrect - Whether the prediction was correct
   * @returns Points to award (positive for correct, negative for incorrect)
   */
  calculatePoints(prediction: PredictionWithGame, dailyPredictionCount: number, isCorrect: boolean): number {
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

    // Handle incorrect predictions
    if (!isCorrect) {
      // Calculate loss (negative points)
      const lossPoints = calculateIncorrectPoints(odds)

      logger.debug('Calculated loss points', {
        predictionId: prediction.id,
        odds,
        isCorrect: false,
        lossPoints,
      })

      return lossPoints // Return negative value (no tier multiplier or diminishing returns)
    }

    // Handle correct predictions (existing logic)
    const rawPoints = calculateTotalPoints(odds)

    // Apply bonus tier multiplier (1.5x for first pick of the day)
    const tierMultiplier = prediction.bonusTier ? 1.5 : 1.0
    const pointsWithBonus = rawPoints * tierMultiplier

    // Apply diminishing returns based on daily volume
    const finalPoints = applyDiminishingReturns(pointsWithBonus, dailyPredictionCount)

    logger.debug('Calculated points', {
      predictionId: prediction.id,
      odds,
      dailyPredictionCount,
      bonusTier: prediction.bonusTier,
      isCorrect: true,
      tierMultiplier,
      rawPoints,
      pointsWithBonus,
      finalPoints,
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
   * Streaks are now purely cosmetic for achievement tracking.
   * They don't affect point calculations.
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
      select: { currentStreak: true, longestStreak: true },
    })

    const currentStreak = user?.currentStreak ?? 0
    const longestStreak = user?.longestStreak ?? 0

    if (isCorrect) {
      // Increment streak
      const newStreak = currentStreak + 1

      // Update longest streak if new record
      const updateData: { currentStreak: number; longestStreak?: number } = {
        currentStreak: newStreak,
      }

      if (newStreak > longestStreak) {
        updateData.longestStreak = newStreak
        logger.debug('New longest streak record!', { userId, newStreak })
      }

      await prisma.user.update({
        where: { id: userId },
        data: updateData,
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
    startOfDay.setUTCHours(DAILY_RESET_HOUR_UTC, 0, 0, 0)

    // If beforeTimestamp is before today's reset, use yesterday's reset
    if (beforeTimestamp < startOfDay) {
      startOfDay.setDate(startOfDay.getDate() - 1)
    }

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

  /**
   * Get user's points transaction history (paginated)
   *
   * @param userId - User ID
   * @param limit - Maximum number of entries to return
   * @param offset - Number of entries to skip
   * @returns Array of ledger entries
   */
  async getPointsHistory(
    userId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<Array<{ id: string; delta: number; reason: string; meta: unknown; createdAt: Date }>> {
    const entries = await prisma.pointsLedger.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        delta: true,
        reason: true,
        meta: true,
        createdAt: true,
      },
    })

    return entries
  }

  /**
   * Get win rate breakdown by league
   *
   * @param userId - User ID
   * @returns Array of league statistics
   */
  async getWinRateByLeague(userId: string): Promise<LeagueStats[]> {
    // Get all processed predictions with game data
    const predictions = await prisma.prediction.findMany({
      where: {
        userId,
        processedAt: { not: null },
        isCorrect: { not: null },
      },
      include: {
        game: true,
      },
    })

    // Get points earned per league from ledger
    const pointsByLeague = await prisma.pointsLedger.groupBy({
      by: ['userId'],
      where: {
        userId,
        reason: { startsWith: 'Correct prediction' },
      },
      _sum: { delta: true },
    })

    // Group by league
    const leagueMap = new Map<string, { total: number; correct: number; points: number }>()

    for (const pred of predictions) {
      const league = pred.game.league
      const current = leagueMap.get(league) ?? { total: 0, correct: 0, points: 0 }
      current.total++
      if (pred.isCorrect) current.correct++
      leagueMap.set(league, current)
    }

    // Calculate points per league by parsing meta
    const ledgerEntries = await prisma.pointsLedger.findMany({
      where: {
        userId,
        reason: { startsWith: 'Correct prediction' },
      },
      select: {
        delta: true,
        meta: true,
      },
    })

    for (const entry of ledgerEntries) {
      const meta = entry.meta as { league?: string; predictionId?: string } | null
      let league = meta?.league

      // If league not in meta, try to look it up from the prediction
      if (!league && meta?.predictionId) {
        const prediction = predictions.find((p) => p.id === meta.predictionId)
        if (prediction) {
          league = prediction.game.league
        }
      }

      if (league && leagueMap.has(league)) {
        const current = leagueMap.get(league)!
        current.points += entry.delta
      }
    }

    // Convert to array with win rates
    return Array.from(leagueMap.entries()).map(([league, stats]) => ({
      league,
      totalPredictions: stats.total,
      correctPredictions: stats.correct,
      winRate: stats.total > 0 ? stats.correct / stats.total : 0,
      pointsEarned: stats.points,
    }))
  }

  /**
   * Get points earned over time (daily aggregation)
   *
   * @param userId - User ID
   * @param days - Number of days to look back
   * @returns Array of daily point totals
   */
  async getPointsOverTime(
    userId: string,
    days: number = 30
  ): Promise<Array<{ date: string; pointsEarned: number; predictionsScored: number }>> {
    const since = new Date()
    since.setDate(since.getDate() - days)
    since.setUTCHours(0, 0, 0, 0)

    // Get ledger entries grouped by date
    const entries = await prisma.pointsLedger.findMany({
      where: {
        userId,
        createdAt: { gte: since },
      },
      orderBy: { createdAt: 'asc' },
      select: {
        delta: true,
        createdAt: true,
        reason: true,
      },
    })

    // Group by date
    const dailyMap = new Map<string, { points: number; predictions: number }>()

    for (const entry of entries) {
      const dateKey = entry.createdAt.toISOString().split('T')[0]
      const current = dailyMap.get(dateKey) ?? { points: 0, predictions: 0 }
      current.points += entry.delta
      if (entry.reason.startsWith('Correct prediction')) {
        current.predictions++
      }
      dailyMap.set(dateKey, current)
    }

    return Array.from(dailyMap.entries())
      .map(([date, stats]) => ({
        date,
        pointsEarned: stats.points,
        predictionsScored: stats.predictions,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  /**
   * Get longest streak for a user
   *
   * @param userId - User ID
   * @returns Longest streak achieved
   */
  async getLongestStreak(userId: string): Promise<number> {
    // Retrieve from user record (tracked in real-time now)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { longestStreak: true },
    })

    return user?.longestStreak ?? 0
  }

  /**
   * Get comprehensive user statistics
   *
   * @param userId - User ID
   * @returns Complete user stats object
   */
  async getUserStats(userId: string): Promise<UserStats> {
    // Run queries in parallel for efficiency
    const [totalPoints, user, longestStreak, allPredictions, todayStats, byLeague, pointsOverTime, leaderboardRank] =
      await Promise.all([
        this.getUserPoints(userId),
        prisma.user.findUnique({ where: { id: userId }, select: { currentStreak: true } }),
        this.getLongestStreak(userId),
        prisma.prediction.findMany({
          where: { userId, processedAt: { not: null }, isCorrect: { not: null } },
          select: { isCorrect: true },
        }),
        this.getTodayStats(userId),
        this.getWinRateByLeague(userId),
        this.getPointsOverTime(userId, 30),
        this.getUserRank(userId),
      ])

    const totalPredictions = allPredictions.length
    const correctPredictions = allPredictions.filter((p) => p.isCorrect).length
    const overallWinRate = totalPredictions > 0 ? correctPredictions / totalPredictions : 0

    return {
      totalPoints,
      currentStreak: user?.currentStreak ?? 0,
      longestStreak,
      totalPredictions,
      correctPredictions,
      overallWinRate,
      pointsEarnedToday: todayStats.pointsEarned,
      predictionsToday: todayStats.predictionsToday,
      bonusTierUsed: todayStats.bonusTierUsed,
      leaderboardRank,
      byLeague,
      pointsOverTime,
    }
  }

  /**
   * Get today's statistics for a user
   *
   * @param userId - User ID
   * @returns Today's points, predictions, and bonus tier usage
   */
  private async getTodayStats(
    userId: string
  ): Promise<{ pointsEarned: number; predictionsToday: number; bonusTierUsed: number }> {
    const now = new Date()
    const startOfDay = new Date(now)
    startOfDay.setUTCHours(DAILY_RESET_HOUR_UTC, 0, 0, 0)

    // If current time is before today's reset, use yesterday's reset
    if (now < startOfDay) {
      startOfDay.setDate(startOfDay.getDate() - 1)
    }

    const [pointsResult, predictionsToday, bonusTierCount] = await Promise.all([
      prisma.pointsLedger.aggregate({
        where: { userId, createdAt: { gte: startOfDay } },
        _sum: { delta: true },
      }),
      prisma.prediction.count({
        where: { userId, createdAt: { gte: startOfDay } },
      }),
      prisma.prediction.count({
        where: { userId, createdAt: { gte: startOfDay }, bonusTier: true },
      }),
    ])

    return {
      pointsEarned: pointsResult._sum.delta ?? 0,
      predictionsToday,
      bonusTierUsed: bonusTierCount,
    }
  }

  /**
   * Get user's rank on the leaderboard
   *
   * @param userId - User ID
   * @returns User's rank (1-based) or null if not ranked
   */
  private async getUserRank(userId: string): Promise<number | null> {
    const userPoints = await this.getUserPoints(userId)
    if (userPoints === 0) return null

    // Count users with more points
    const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(DISTINCT "userId") as count
      FROM (
        SELECT "userId", SUM("delta") as points
        FROM "PointsLedger"
        GROUP BY "userId"
        HAVING SUM("delta") > ${userPoints}
      ) as higher_ranked
    `

    const higherRanked = Number(result[0]?.count ?? 0)
    return higherRanked + 1
  }
}

// Export singleton instance
export const pointsService = new PointsService()
