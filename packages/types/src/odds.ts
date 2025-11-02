/**
 * Unified odds structure - provider-agnostic
 *
 * This represents the best available odds across all providers
 * for a single game, without exposing which provider supplied each odd.
 */
export type UnifiedGameOdds = {
  /**
   * Moneyline odds for both teams
   * Format: American odds (e.g., -150, +200)
   */
  moneyline: {
    home: number
    away: number
  } | null

  /**
   * Point spread with optional prices
   * Value is from home team's perspective (negative means home favored)
   */
  spread: {
    value: number
    homePrice?: number
    awayPrice?: number
  } | null

  /**
   * Total (over/under) with optional prices
   */
  total: {
    value: number
    overPrice?: number
    underPrice?: number
  } | null
}

/**
 * Team information for client consumption
 */
export type TeamInfo = {
  id: string
  code: string
  name: string
  nickname?: string
  city?: string
  logoUrl?: string
  primaryColor?: string
}

/**
 * Game with unified odds for client consumption
 */
export type GameWithUnifiedOdds = {
  id: string
  league: string
  startsAt: Date | string
  homeTeam: TeamInfo
  awayTeam: TeamInfo
  status: string
  odds: UnifiedGameOdds
  result?: {
    id: string
    gameId: string
    homeScore: number
    awayScore: number
    settledAt: Date | string
  } | null
}
