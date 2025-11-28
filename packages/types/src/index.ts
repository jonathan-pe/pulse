import { z } from 'zod'

export const userSchema = z.object({
  id: z.string(),
  email: z.email(),
  name: z.string().nullable().optional(),
})

export type User = z.infer<typeof userSchema>

export const typesVersion = 1 as const

// Re-export odds types
export * from './odds'

// Phase 2: Engagement Features Types

/**
 * Point transaction ledger entry
 */
export interface PointsLedgerEntry {
  id: string
  delta: number
  reason: string
  meta: Record<string, unknown> | null
  createdAt: string
}

/**
 * Leaderboard entry with rank information
 */
export interface LeaderboardEntry {
  rank: number
  userId: string
  username: string | null
  imageUrl: string | null
  points: number
  rankChange: number | null // +/- change from previous period (null if no previous data)
}

/**
 * Time period for leaderboard filtering
 */
export type LeaderboardPeriod = 'daily' | 'weekly' | 'alltime'

/**
 * Win rate statistics by league
 */
export interface LeagueStats {
  league: string
  totalPredictions: number
  correctPredictions: number
  winRate: number
  pointsEarned: number
}

/**
 * Points earned over time (daily aggregation)
 */
export interface PointsTimeSeries {
  date: string // YYYY-MM-DD
  pointsEarned: number
  predictionsScored: number
}

/**
 * Comprehensive user statistics
 */
export interface UserStats {
  totalPoints: number
  currentStreak: number
  longestStreak: number
  totalPredictions: number
  correctPredictions: number
  overallWinRate: number
  pointsEarnedToday: number
  predictionsToday: number
  bonusTierUsed: number // 0-5
  leaderboardRank: number | null
  byLeague: LeagueStats[]
  pointsOverTime: PointsTimeSeries[]
}
