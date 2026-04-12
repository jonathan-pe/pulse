import type { PredictionType } from '@pulse/types'

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
  type: PredictionType
  pick: string
}

export interface BatchPredictionsRequest {
  predictions: PredictionInput[]
}

export interface BatchPredictionsResult {
  created: Array<{ id: string; gameId: string; type: string; pick: string }>
  errors: Array<{ gameId: string; error: string; code?: string }>
}

export type ParlayTicketType = 'MULTI_GAME' | 'SAME_GAME'

export interface CreateParlayRequest {
  ticketType: ParlayTicketType
  legs: PredictionInput[]
}

/**
 * Prediction Stats
 */
export interface DailyStats {
  totalToday: number
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
  type: PredictionType
  pick: string
  createdAt: string
  lockedAt: string | null
}

/**
 * Prediction with full game details (from /predictions/history)
 */
export interface PredictionWithGame extends BasePrediction {
  outcome: 'WIN' | 'LOSS' | 'PUSH' | null // Result (null = not yet scored)
  processedAt: string | null // When prediction was scored
  pointsEarned: number | null // Points awarded for this prediction
  oddsAtPrediction: OddsSnapshot | null // Odds when prediction was made
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

export type ParlayTicketStatus = 'PENDING' | 'WON' | 'LOST' | 'PUSHED'

/** Leg row from `GET /parlays` (nested game for display). */
export interface ParlayLegWithGame {
  id: string
  gameId: string
  type: PredictionType
  pick: string
  outcome: 'WIN' | 'LOSS' | 'PUSH' | null
  oddsSnapshot: OddsSnapshot | null
  game: {
    id: string
    homeTeam: PredictionWithGame['game']['homeTeam']
    awayTeam: PredictionWithGame['game']['awayTeam']
    startsAt: string
    league: string
    status: string
    result: { homeScore: number; awayScore: number } | null
  }
}

/** Parlay ticket from `GET /parlays` / `GET /parlays/:id` */
export interface ParlayWithLegs {
  id: string
  userId: string
  ticketType: ParlayTicketType
  status: ParlayTicketStatus
  pricingVersion: string
  combinedImpliedProbability: number | null
  sgpMetadata: Record<string, unknown> | null
  createdAt: string
  processedAt: string | null
  legs: ParlayLegWithGame[]
  /** Present on list when a ledger line exists for this parlay */
  pointsEarned?: number | null
}

/**
 * Odds snapshot at time of prediction
 */
export interface OddsSnapshot {
  moneyline?: {
    home: number
    away: number
  }
  spread?: {
    value: number
    homePrice: number
    awayPrice: number
  }
  total?: {
    value: number
    overPrice: number
    underPrice: number
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
