/**
 * API Request/Response Types
 *
 * These types represent the contracts between frontend and backend.
 * Components can extend these with their specific needs.
 */

/**
 * Prediction Creation
 */
export interface PredictionInput {
  gameId: string
  type: 'MONEYLINE' | 'SPREAD' | 'TOTAL'
  pick: string
}

export interface BatchPredictionsRequest {
  predictions: PredictionInput[]
}

export interface BatchPredictionsResult {
  created: Array<{ id: string; gameId: string; type: string; pick: string }>
  errors: Array<{ gameId: string; error: string }>
}

/**
 * Prediction Stats
 */
export interface DailyStats {
  totalToday: number
  totalRemaining: number
}

/**
 * Points
 */
export interface UserPoints {
  points: number
}

export interface LeaderboardEntry {
  userId: string
  points: number
}

/**
 * Auth
 */
export interface AuthUser {
  userId: string
  user: {
    id: string
  }
}

/**
 * Base Prediction Type
 * Note: API endpoints return different shapes depending on the endpoint.
 * Components should define their own types based on what they need.
 *
 * Example:
 * - /predictions/history returns predictions with nested game data
 * - /predictions/pending returns predictions without full game details
 * - /predictions/by-game returns a grouped object, not an array
 */
export interface BasePrediction {
  id: string
  gameId: string
  type: 'MONEYLINE' | 'SPREAD' | 'TOTAL'
  pick: string
  createdAt: string
  lockedAt: string | null
}

/**
 * Prediction with full game details (from /predictions/history)
 */
export interface PredictionWithGame extends BasePrediction {
  bonusTier: boolean // Whether this prediction gets 1.5x multiplier
  isCorrect: boolean | null // Result of prediction (null = not yet scored)
  processedAt: string | null // When prediction was scored
  pointsEarned: number | null // Points awarded for this prediction
  game: {
    id: string
    homeTeam: {
      name: string
      code: string
      logoUrl: string | null
    }
    awayTeam: {
      name: string
      code: string
      logoUrl: string | null
    }
    startsAt: string
    league: string
    result: {
      homeScore: number
      awayScore: number
    } | null
  }
}

/**
 * Predictions list response
 */
export interface PredictionsResponse {
  predictions: BasePrediction[]
}

/**
 * Predictions grouped by game and type
 * Format: { [gameId]: { [type]: pick } }
 * Example: { "game-123": { "MONEYLINE": "home", "SPREAD": "away" } }
 */
export type PredictionsByGameResponse = Record<string, Record<string, string>>
