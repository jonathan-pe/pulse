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

// Re-export achievement types
export * from './achievements'

// Shared constants
export const LEAGUES = ['NBA', 'NFL', 'MLB', 'NHL'] as const
export type League = (typeof LEAGUES)[number]

export const MARKETS = ['moneyline', 'pointspread', 'overunder'] as const
export type Market = (typeof MARKETS)[number]

export const PREDICTION_RESULTS = ['pending', 'win', 'loss', 'push'] as const
export type PredictionResult = (typeof PREDICTION_RESULTS)[number]

// Prediction types
export const PREDICTION_TYPES = ['MONEYLINE', 'SPREAD', 'TOTAL'] as const
export type PredictionType = (typeof PREDICTION_TYPES)[number]

// Game status
export const GAME_STATUSES = ['scheduled', 'live', 'final'] as const
export type GameStatus = (typeof GAME_STATUSES)[number]

// Pick values
export const PICK_VALUES = ['home', 'away', 'over', 'under'] as const
export type PickValue = (typeof PICK_VALUES)[number]

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
  longestStreak: number // Added for achievement tracking
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
