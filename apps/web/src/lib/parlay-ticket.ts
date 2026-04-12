import type { CartSelection } from '@/store/cart'
import type { ParlayTicketType } from '@/types/api'

/**
 * Infer multi-game vs same-game (SGP) from cart selections.
 * Returns null if the slip is not a valid parlay shape (e.g. mixed multi-pick games).
 */
export function inferParlayTicketType(selections: CartSelection[]): ParlayTicketType | null {
  if (selections.length < 2) return null
  const gameIds = [...new Set(selections.map((s) => s.gameId))]
  if (gameIds.length === 1) return 'SAME_GAME'
  if (gameIds.length === selections.length) return 'MULTI_GAME'
  return null
}
