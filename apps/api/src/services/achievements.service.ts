import { prisma } from '@/lib/db'
import type { AchievementCriteria, AchievementWithProgress, AchievementShowcase, AchievementStats } from '@pulse/types'
import { createLogger } from '../lib/logger'

const logger = createLogger('AchievementsService')

/**
 * AchievementsService - Handles achievement tracking and unlocking
 */
export class AchievementsService {
  /**
   * Check and unlock achievements for a user
   * Call this after significant events (correct prediction, milestone reached, etc.)
   *
   * @param userId - User ID to check achievements for
   * @returns Array of newly unlocked achievement IDs
   */
  async checkAndUnlockAchievements(userId: string): Promise<string[]> {
    // Get all achievements
    const allAchievements = await prisma.achievement.findMany()

    // Get user's current achievements
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true },
    })

    const unlockedIds = new Set(userAchievements.map((ua) => ua.achievementId))
    const newlyUnlocked: string[] = []

    // Check each locked achievement
    for (const achievement of allAchievements) {
      if (unlockedIds.has(achievement.id)) continue

      const criteria = achievement.criteria as AchievementCriteria
      const meetsRequirement = await this.checkCriteria(userId, criteria)

      if (meetsRequirement) {
        // Unlock achievement
        await prisma.userAchievement.create({
          data: {
            userId,
            achievementId: achievement.id,
            progress: this.getMaxProgress(criteria),
          },
        })

        newlyUnlocked.push(achievement.id)
        logger.info('Achievement unlocked', { userId, achievementId: achievement.id, key: achievement.key })
      }
    }

    return newlyUnlocked
  }

  /**
   * Check if user meets criteria for an achievement
   */
  private async checkCriteria(userId: string, criteria: AchievementCriteria): Promise<boolean> {
    switch (criteria.type) {
      case 'streak': {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { longestStreak: true },
        })
        return (user?.longestStreak ?? 0) >= criteria.value
      }

      case 'total_predictions': {
        const count = await prisma.prediction.count({
          where: { userId, processedAt: { not: null } },
        })
        return count >= criteria.value
      }

      case 'total_points': {
        const result = await prisma.pointsLedger.aggregate({
          where: { userId },
          _sum: { delta: true },
        })
        return (result._sum.delta ?? 0) >= criteria.value
      }

      case 'win_rate': {
        const predictions = await prisma.prediction.findMany({
          where: { userId, processedAt: { not: null }, isCorrect: { not: null } },
          select: { isCorrect: true },
        })

        if (predictions.length < criteria.minPredictions) return false

        const correct = predictions.filter((p) => p.isCorrect).length
        const winRate = correct / predictions.length
        return winRate >= criteria.winRate
      }

      case 'league_accuracy': {
        const predictions = await prisma.prediction.findMany({
          where: {
            userId,
            processedAt: { not: null },
            isCorrect: { not: null },
            game: { league: criteria.league },
          },
          select: { isCorrect: true },
        })

        if (predictions.length < criteria.minPredictions) return false

        const correct = predictions.filter((p) => p.isCorrect).length
        const winRate = correct / predictions.length
        return winRate >= criteria.winRate
      }

      case 'perfect_days': {
        // Count days where all predictions were correct
        const predictions = await prisma.prediction.findMany({
          where: { userId, processedAt: { not: null }, isCorrect: { not: null } },
          select: { isCorrect: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
        })

        const dayMap = new Map<string, { total: number; correct: number }>()

        for (const pred of predictions) {
          const day = pred.createdAt.toISOString().split('T')[0]
          const current = dayMap.get(day) ?? { total: 0, correct: 0 }
          current.total++
          if (pred.isCorrect) current.correct++
          dayMap.set(day, current)
        }

        const perfectDays = Array.from(dayMap.values()).filter((d) => d.total === d.correct && d.total > 0).length

        return perfectDays >= criteria.value
      }

      case 'underdog_specialist': {
        const predictions = await prisma.prediction.findMany({
          where: {
            userId,
            processedAt: { not: null },
            isCorrect: { not: null },
          },
          select: {
            isCorrect: true,
            oddsAtPrediction: true,
            type: true,
            pick: true,
          },
        })

        // Filter to underdogs meeting min odds
        const underdogPredictions = predictions.filter((pred) => {
          const odds = this.extractOdds(pred)
          return odds !== null && odds >= criteria.minOdds
        })

        if (underdogPredictions.length < criteria.minPredictions) return false

        const correct = underdogPredictions.filter((p) => p.isCorrect).length
        const winRate = correct / underdogPredictions.length
        return winRate >= criteria.winRate
      }

      case 'multi_sport': {
        const leagueCounts = await prisma.prediction.groupBy({
          by: ['gameId'],
          where: {
            userId,
            processedAt: { not: null },
          },
          _count: true,
        })

        // Need to join with games to get league info
        const gameIds = leagueCounts.map((lc) => lc.gameId)
        const games = await prisma.game.findMany({
          where: { id: { in: gameIds } },
          select: { id: true, league: true },
        })

        const gameIdToLeague = new Map(games.map((g) => [g.id, g.league]))
        const leagueCountMap = new Map<string, number>()

        for (const lc of leagueCounts) {
          const league = gameIdToLeague.get(lc.gameId)
          if (!league) continue
          leagueCountMap.set(league, (leagueCountMap.get(league) ?? 0) + 1)
        }

        const qualifiedLeagues = Array.from(leagueCountMap.values()).filter(
          (count) => count >= criteria.minPredictionsPerLeague
        ).length

        return qualifiedLeagues >= criteria.minLeagues
      }

      case 'leaderboard_rank': {
        // This would need a separate leaderboard service
        // For now, return false as placeholder
        logger.warn('Leaderboard rank achievement not yet implemented', { userId, criteria })
        return false
      }

      default:
        logger.error('Unknown achievement criteria type', { userId, criteria })
        return false
    }
  }

  /**
   * Extract odds from prediction based on type and pick
   */
  private extractOdds(prediction: { type: string; pick: string; oddsAtPrediction: unknown }): number | null {
    const odds = prediction.oddsAtPrediction as any

    if (!odds) return null

    try {
      switch (prediction.type) {
        case 'MONEYLINE':
          return odds.moneyline?.[prediction.pick] ?? null
        case 'SPREAD':
          return odds.spread?.[prediction.pick === 'home' ? 'homePrice' : 'awayPrice'] ?? null
        case 'TOTAL':
          return odds.total?.[prediction.pick === 'over' ? 'overPrice' : 'underPrice'] ?? null
        default:
          return null
      }
    } catch {
      return null
    }
  }

  /**
   * Get max progress value for a criteria (for percentage calculations)
   */
  private getMaxProgress(criteria: AchievementCriteria): number {
    switch (criteria.type) {
      case 'streak':
      case 'total_predictions':
      case 'total_points':
      case 'perfect_days':
        return criteria.value
      case 'win_rate':
      case 'league_accuracy':
      case 'underdog_specialist':
        return criteria.minPredictions
      case 'multi_sport':
        return criteria.minLeagues
      case 'leaderboard_rank':
        return 1
      default:
        return 100
    }
  }

  /**
   * Calculate current progress toward an achievement
   */
  async calculateProgress(userId: string, criteria: AchievementCriteria): Promise<number> {
    switch (criteria.type) {
      case 'streak': {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { longestStreak: true },
        })
        return user?.longestStreak ?? 0
      }

      case 'total_predictions': {
        return await prisma.prediction.count({
          where: { userId, processedAt: { not: null } },
        })
      }

      case 'total_points': {
        const result = await prisma.pointsLedger.aggregate({
          where: { userId },
          _sum: { delta: true },
        })
        return result._sum.delta ?? 0
      }

      case 'win_rate':
      case 'league_accuracy':
      case 'underdog_specialist': {
        // Return number of qualifying predictions made so far
        let count = 0

        if (criteria.type === 'win_rate') {
          count = await prisma.prediction.count({
            where: { userId, processedAt: { not: null }, isCorrect: { not: null } },
          })
        } else if (criteria.type === 'league_accuracy') {
          count = await prisma.prediction.count({
            where: {
              userId,
              processedAt: { not: null },
              isCorrect: { not: null },
              game: { league: criteria.league },
            },
          })
        } else if (criteria.type === 'underdog_specialist') {
          const predictions = await prisma.prediction.findMany({
            where: { userId, processedAt: { not: null }, isCorrect: { not: null } },
            select: { oddsAtPrediction: true, type: true, pick: true },
          })
          count = predictions.filter((pred) => {
            const odds = this.extractOdds(pred)
            return odds !== null && odds >= criteria.minOdds
          }).length
        }

        return count
      }

      case 'perfect_days': {
        const predictions = await prisma.prediction.findMany({
          where: { userId, processedAt: { not: null }, isCorrect: { not: null } },
          select: { isCorrect: true, createdAt: true },
        })

        const dayMap = new Map<string, { total: number; correct: number }>()

        for (const pred of predictions) {
          const day = pred.createdAt.toISOString().split('T')[0]
          const current = dayMap.get(day) ?? { total: 0, correct: 0 }
          current.total++
          if (pred.isCorrect) current.correct++
          dayMap.set(day, current)
        }

        return Array.from(dayMap.values()).filter((d) => d.total === d.correct && d.total > 0).length
      }

      case 'multi_sport': {
        const leagueCounts = await prisma.prediction.groupBy({
          by: ['gameId'],
          where: { userId, processedAt: { not: null } },
          _count: true,
        })

        const gameIds = leagueCounts.map((lc) => lc.gameId)
        const games = await prisma.game.findMany({
          where: { id: { in: gameIds } },
          select: { id: true, league: true },
        })

        const gameIdToLeague = new Map(games.map((g) => [g.id, g.league]))
        const leagueCountMap = new Map<string, number>()

        for (const lc of leagueCounts) {
          const league = gameIdToLeague.get(lc.gameId)
          if (!league) continue
          leagueCountMap.set(league, (leagueCountMap.get(league) ?? 0) + 1)
        }

        return Array.from(leagueCountMap.values()).filter((count) => count >= criteria.minPredictionsPerLeague).length
      }

      case 'leaderboard_rank':
        return 0

      default:
        return 0
    }
  }

  /**
   * Get all achievements with user progress
   */
  async getAchievementsWithProgress(userId: string): Promise<AchievementWithProgress[]> {
    const achievements = await prisma.achievement.findMany({
      orderBy: [{ category: 'asc' }, { rarity: 'asc' }],
    })

    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId },
    })

    const userAchMap = new Map(userAchievements.map((ua) => [ua.achievementId, ua]))

    const results: AchievementWithProgress[] = []

    for (const achievement of achievements) {
      const userAch = userAchMap.get(achievement.id)
      const criteria = achievement.criteria as AchievementCriteria
      const maxProgress = this.getMaxProgress(criteria)

      let progress = 0
      if (userAch) {
        progress = userAch.progress
      } else {
        progress = await this.calculateProgress(userId, criteria)
      }

      results.push({
        id: achievement.id,
        key: achievement.key,
        name: achievement.name,
        description: achievement.description,
        category: achievement.category,
        rarity: achievement.rarity,
        iconUrl: achievement.iconUrl,
        criteria,
        createdAt: achievement.createdAt.toISOString(),
        updatedAt: achievement.updatedAt.toISOString(),
        isUnlocked: !!userAch,
        unlockedAt: userAch?.unlockedAt.toISOString() ?? null,
        progress,
        maxProgress,
        progressPercentage: maxProgress > 0 ? (progress / maxProgress) * 100 : 0,
        isDisplayed: userAch?.isDisplayed ?? false,
      })
    }

    return results
  }

  /**
   * Get user's achievement showcase for profile display
   */
  async getAchievementShowcase(userId: string): Promise<AchievementShowcase> {
    const allWithProgress = await this.getAchievementsWithProgress(userId)
    const unlocked = allWithProgress.filter((a) => a.isUnlocked)
    const displayed = unlocked.filter((a) => a.isDisplayed).slice(0, 5)

    // Get most recent unlocks
    const recentUnlocks = unlocked
      .sort((a, b) => {
        if (!a.unlockedAt || !b.unlockedAt) return 0
        return new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime()
      })
      .slice(0, 5)

    return {
      userId,
      displayedAchievements: displayed,
      totalUnlocked: unlocked.length,
      totalAvailable: allWithProgress.length,
      recentUnlocks,
    }
  }

  /**
   * Get achievement statistics for a user
   */
  async getAchievementStats(userId: string): Promise<AchievementStats> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { currentStreak: true, longestStreak: true },
    })

    const allAchievements = await prisma.achievement.findMany()
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
    })

    const rarityCounts: Record<string, number> = {
      COMMON: 0,
      RARE: 0,
      EPIC: 0,
      LEGENDARY: 0,
    }

    for (const ua of userAchievements) {
      rarityCounts[ua.achievement.rarity]++
    }

    return {
      currentStreak: user?.currentStreak ?? 0,
      longestStreak: user?.longestStreak ?? 0,
      totalAchievements: userAchievements.length,
      commonUnlocked: rarityCounts.COMMON,
      rareUnlocked: rarityCounts.RARE,
      epicUnlocked: rarityCounts.EPIC,
      legendaryUnlocked: rarityCounts.LEGENDARY,
      completionPercentage: (userAchievements.length / allAchievements.length) * 100,
    }
  }

  /**
   * Update user's displayed achievements
   */
  async updateDisplayedAchievements(userId: string, achievementIds: string[]): Promise<void> {
    if (achievementIds.length > 5) {
      throw new Error('Cannot display more than 5 achievements')
    }

    // Verify all achievements are unlocked by user
    const userAchievements = await prisma.userAchievement.findMany({
      where: {
        userId,
        achievementId: { in: achievementIds },
      },
    })

    if (userAchievements.length !== achievementIds.length) {
      throw new Error('Cannot display achievements that are not unlocked')
    }

    // Clear all displayed flags
    await prisma.userAchievement.updateMany({
      where: { userId },
      data: { isDisplayed: false },
    })

    // Set new displayed achievements
    if (achievementIds.length > 0) {
      await prisma.userAchievement.updateMany({
        where: {
          userId,
          achievementId: { in: achievementIds },
        },
        data: { isDisplayed: true },
      })
    }

    logger.info('Updated displayed achievements', { userId, count: achievementIds.length })
  }
}

export const achievementsService = new AchievementsService()
