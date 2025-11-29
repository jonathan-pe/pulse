/**
 * Achievement System Types
 *
 * Defines types for the cosmetic achievement/progression system.
 * Achievements don't affect point scoring but provide goals and recognition.
 */

import { z } from 'zod'

/**
 * Achievement categories for organization
 */
export const achievementCategorySchema = z.enum(['STREAK', 'MILESTONE', 'LEAGUE_EXPERTISE', 'SOCIAL', 'SPECIAL'])

export type AchievementCategory = z.infer<typeof achievementCategorySchema>

/**
 * Achievement rarity tiers
 */
export const achievementRaritySchema = z.enum(['COMMON', 'RARE', 'EPIC', 'LEGENDARY'])

export type AchievementRarity = z.infer<typeof achievementRaritySchema>

/**
 * Achievement criteria types
 */
export const achievementCriteriaSchema = z.discriminatedUnion('type', [
  // Streak-based achievements
  z.object({
    type: z.literal('streak'),
    value: z.number(), // Consecutive correct predictions required
  }),

  // Total prediction count
  z.object({
    type: z.literal('total_predictions'),
    value: z.number(),
  }),

  // Total points earned
  z.object({
    type: z.literal('total_points'),
    value: z.number(),
  }),

  // Win rate percentage (over minimum predictions)
  z.object({
    type: z.literal('win_rate'),
    winRate: z.number(), // e.g., 0.75 for 75%
    minPredictions: z.number(), // Minimum sample size
  }),

  // League-specific accuracy
  z.object({
    type: z.literal('league_accuracy'),
    league: z.string(), // e.g., 'NBA', 'NFL'
    winRate: z.number(),
    minPredictions: z.number(),
  }),

  // Perfect day (all predictions correct)
  z.object({
    type: z.literal('perfect_days'),
    value: z.number(), // Number of perfect days required
  }),

  // Underdog specialist (high win rate on +X or longer)
  z.object({
    type: z.literal('underdog_specialist'),
    minOdds: z.number(), // e.g., +200
    winRate: z.number(),
    minPredictions: z.number(),
  }),

  // Multi-sport engagement
  z.object({
    type: z.literal('multi_sport'),
    minLeagues: z.number(), // Number of different leagues
    minPredictionsPerLeague: z.number(),
  }),

  // Leaderboard ranking
  z.object({
    type: z.literal('leaderboard_rank'),
    rank: z.number(), // e.g., top 10, top 100
    period: z.enum(['daily', 'weekly', 'alltime']),
  }),
])

export type AchievementCriteria = z.infer<typeof achievementCriteriaSchema>

/**
 * Full achievement definition
 */
export interface Achievement {
  id: string
  key: string
  name: string
  description: string
  category: AchievementCategory
  rarity: AchievementRarity
  iconUrl: string | null
  criteria: AchievementCriteria
  createdAt: string
  updatedAt: string
}

/**
 * User's progress toward/completion of an achievement
 */
export interface UserAchievement {
  id: string
  userId: string
  achievementId: string
  achievement: Achievement
  unlockedAt: string
  progress: number
  isDisplayed: boolean
}

/**
 * Achievement with user progress information
 */
export interface AchievementWithProgress extends Achievement {
  isUnlocked: boolean
  unlockedAt: string | null
  progress: number
  maxProgress: number
  progressPercentage: number
  isDisplayed: boolean
}

/**
 * User's achievement showcase for profile display
 */
export interface AchievementShowcase {
  userId: string
  displayedAchievements: AchievementWithProgress[] // Max 3-5 badges
  totalUnlocked: number
  totalAvailable: number
  recentUnlocks: AchievementWithProgress[]
}

/**
 * Achievement statistics
 */
export interface AchievementStats {
  currentStreak: number
  longestStreak: number
  totalAchievements: number
  commonUnlocked: number
  rareUnlocked: number
  epicUnlocked: number
  legendaryUnlocked: number
  completionPercentage: number
}

/**
 * Request to update displayed achievements
 */
export const updateDisplayedAchievementsSchema = z.object({
  achievementIds: z.array(z.string()).max(5), // Max 5 displayed
})

export type UpdateDisplayedAchievements = z.infer<typeof updateDisplayedAchievementsSchema>
