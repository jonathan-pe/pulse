import { prisma } from '@/lib/db'
import type { PredictionOutcome, PredictionType } from '@/lib/db'
import type { LeagueStats, UserStats } from '@pulse/types'
import { createLogger } from '../lib/logger'
import { calculateTotalPoints, calculateIncorrectPoints, DAILY_RESET_HOUR_UTC } from '@pulse/shared'

const logger = createLogger('PointsService')

/** Singles scoring result from game outcome (not stored until scored). */
export type PredictionResolution = 'WIN' | 'LOSS' | 'PUSH'

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
  outcome?: PredictionOutcome | null
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
  outcome: PredictionOutcome
  pointsAwarded: number
  streakBefore: number
  streakAfter: number
}

/**
 * PointsService - Handles point calculation and awarding for predictions
 */
export class PointsService {
  /**
   * Resolve prediction to WIN / LOSS / PUSH from game result (Pulse push rules).
   */
  getPredictionOutcome(prediction: PredictionWithGame): PredictionResolution {
    const result = prediction.game.result
    if (!result) {
      throw new Error(`Game ${prediction.gameId} has no result`)
    }

    const { homeScore, awayScore } = result
    const { type, pick } = prediction

    switch (type) {
      case 'MONEYLINE': {
        const homeWon = homeScore > awayScore
        const awayWon = awayScore > homeScore
        const tie = homeScore === awayScore

        if (tie) {
          logger.debug('Moneyline prediction resulted in push', { predictionId: prediction.id })
          return 'PUSH'
        }

        if (pick === 'home') return homeWon ? 'WIN' : 'LOSS'
        if (pick === 'away') return awayWon ? 'WIN' : 'LOSS'
        throw new Error(`Invalid moneyline pick: ${pick}`)
      }

      case 'SPREAD': {
        const oddsData = prediction.oddsAtPrediction
        const spread = oddsData?.spread?.value

        if (spread === undefined || spread === null) {
          throw new Error(`No spread data for prediction ${prediction.id}`)
        }

        const homeScoreWithSpread = homeScore + spread
        const homeCovered = homeScoreWithSpread > awayScore
        const awayCovered = awayScore > homeScoreWithSpread
        const push = homeScoreWithSpread === awayScore

        if (push) {
          logger.debug('Spread prediction resulted in push', { predictionId: prediction.id })
          return 'PUSH'
        }

        if (pick === 'home') return homeCovered ? 'WIN' : 'LOSS'
        if (pick === 'away') return awayCovered ? 'WIN' : 'LOSS'
        throw new Error(`Invalid spread pick: ${pick}`)
      }

      case 'TOTAL': {
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
          return 'PUSH'
        }

        if (pick === 'over') return isOver ? 'WIN' : 'LOSS'
        if (pick === 'under') return isUnder ? 'WIN' : 'LOSS'
        throw new Error(`Invalid total pick: ${pick}`)
      }

      default:
        throw new Error(`Unknown prediction type: ${type}`)
    }
  }

  /**
   * Calculate points for a prediction (WIN / LOSS / PUSH)
   *
   * PUSH → 0 points. WIN / LOSS use the same odds-based rules as before.
   */
  calculatePoints(
    prediction: PredictionWithGame,
    dailyPredictionCount: number,
    outcome: PredictionResolution
  ): number {
    if (outcome === 'PUSH') {
      return 0
    }

    const oddsData = prediction.oddsAtPrediction
    if (!oddsData) {
      throw new Error(`No odds data for prediction ${prediction.id}`)
    }

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
        const pickSide = prediction.pick === 'home' ? 'homePrice' : 'awayPrice'
        odds = oddsData.spread?.[pickSide] ?? -110
        break
      }
      case 'TOTAL': {
        const pickSide = prediction.pick === 'over' ? 'overPrice' : 'underPrice'
        odds = oddsData.total?.[pickSide] ?? -110
        break
      }
      default:
        throw new Error(`Unknown prediction type: ${prediction.type}`)
    }

    if (odds === undefined || odds === null) {
      throw new Error(`Could not extract odds for prediction ${prediction.id}`)
    }

    if (outcome === 'LOSS') {
      const lossPoints = calculateIncorrectPoints(odds)
      logger.debug('Calculated loss points', {
        predictionId: prediction.id,
        odds,
        outcome: 'LOSS',
        lossPoints,
      })
      return lossPoints
    }

    const rawPoints = calculateTotalPoints(odds)
    const finalPoints = Math.round(rawPoints)

    logger.debug('Calculated points', {
      predictionId: prediction.id,
      odds,
      dailyPredictionCount,
      outcome: 'WIN',
      rawPoints,
      finalPoints,
    })

    return finalPoints
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
   * Update singles-only streak (standalone predictions). PUSH does not change the streak.
   */
  async updateSinglesStreak(userId: string, outcome: PredictionResolution): Promise<number> {
    if (outcome === 'PUSH') {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { singlesCurrentStreak: true },
      })
      return user?.singlesCurrentStreak ?? 0
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { singlesCurrentStreak: true, singlesLongestStreak: true },
    })

    const currentStreak = user?.singlesCurrentStreak ?? 0
    const longestStreak = user?.singlesLongestStreak ?? 0

    if (outcome === 'WIN') {
      const newStreak = currentStreak + 1

      const updateData: { singlesCurrentStreak: number; singlesLongestStreak?: number } = {
        singlesCurrentStreak: newStreak,
      }

      if (newStreak > longestStreak) {
        updateData.singlesLongestStreak = newStreak
        logger.debug('New longest singles streak record!', { userId, newStreak })
      }

      await prisma.user.update({
        where: { id: userId },
        data: updateData,
      })

      logger.debug('Singles streak incremented', { userId, from: currentStreak, to: newStreak })
      return newStreak
    }

    if (currentStreak > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: { singlesCurrentStreak: 0 },
      })
      logger.debug('Singles streak reset', { userId, from: currentStreak })
    }
    return 0
  }

  /**
   * Parlay-leg streak: increment on each winning parlay leg when scored; reset on loss; unchanged on push.
   */
  async updateParlayLegStreak(userId: string, outcome: PredictionResolution): Promise<number> {
    if (outcome === 'PUSH') {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { parlayLegCurrentStreak: true },
      })
      return user?.parlayLegCurrentStreak ?? 0
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { parlayLegCurrentStreak: true, parlayLegLongestStreak: true },
    })

    const currentStreak = user?.parlayLegCurrentStreak ?? 0
    const longestStreak = user?.parlayLegLongestStreak ?? 0

    if (outcome === 'WIN') {
      const newStreak = currentStreak + 1
      const updateData: { parlayLegCurrentStreak: number; parlayLegLongestStreak?: number } = {
        parlayLegCurrentStreak: newStreak,
      }
      if (newStreak > longestStreak) {
        updateData.parlayLegLongestStreak = newStreak
      }
      await prisma.user.update({
        where: { id: userId },
        data: updateData,
      })
      return newStreak
    }

    if (currentStreak > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: { parlayLegCurrentStreak: 0 },
      })
    }
    return 0
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
   * Get count of predictions made today by user (for stats / meta)
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
        outcome: { not: null },
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
      if (pred.outcome === 'PUSH' || pred.outcome === null) continue
      const league = pred.game.league
      const current = leagueMap.get(league) ?? { total: 0, correct: 0, points: 0 }
      current.total++
      if (pred.outcome === 'WIN') current.correct++
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
      winRate: stats.total > 0 ? stats.correct / stats.total : 0, // WIN / (all scored legs); pushes count in total
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
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { singlesLongestStreak: true },
    })

    return user?.singlesLongestStreak ?? 0
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
        prisma.user.findUnique({ where: { id: userId }, select: { singlesCurrentStreak: true } }),
        this.getLongestStreak(userId),
        prisma.prediction.findMany({
          where: { userId, processedAt: { not: null }, outcome: { not: null } },
          select: { outcome: true },
        }),
        this.getTodayStats(userId),
        this.getWinRateByLeague(userId),
        this.getPointsOverTime(userId, 30),
        this.getUserRank(userId),
      ])

    const decided = allPredictions.filter((p) => p.outcome === 'WIN' || p.outcome === 'LOSS')
    const totalPredictions = decided.length
    const correctPredictions = allPredictions.filter((p) => p.outcome === 'WIN').length
    const overallWinRate = totalPredictions > 0 ? correctPredictions / totalPredictions : 0

    return {
      totalPoints,
      currentStreak: user?.singlesCurrentStreak ?? 0,
      longestStreak,
      totalPredictions,
      correctPredictions,
      overallWinRate,
      pointsEarnedToday: todayStats.pointsEarned,
      predictionsToday: todayStats.predictionsToday,
      leaderboardRank,
      byLeague,
      pointsOverTime,
    }
  }

  /**
   * Get today's statistics for a user
   *
   * @param userId - User ID
   * @returns Today's points and prediction count
   */
  private async getTodayStats(
    userId: string
  ): Promise<{ pointsEarned: number; predictionsToday: number }> {
    const now = new Date()
    const startOfDay = new Date(now)
    startOfDay.setUTCHours(DAILY_RESET_HOUR_UTC, 0, 0, 0)

    // If current time is before today's reset, use yesterday's reset
    if (now < startOfDay) {
      startOfDay.setDate(startOfDay.getDate() - 1)
    }

    const [pointsResult, predictionsToday] = await Promise.all([
      prisma.pointsLedger.aggregate({
        where: { userId, createdAt: { gte: startOfDay } },
        _sum: { delta: true },
      }),
      prisma.prediction.count({
        where: { userId, createdAt: { gte: startOfDay } },
      }),
    ])

    return {
      pointsEarned: pointsResult._sum.delta ?? 0,
      predictionsToday,
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
