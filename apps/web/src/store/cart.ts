import { create } from 'zustand'

export type CartSelection = {
  // Game context
  gameId: string
  homeTeam: string
  awayTeam: string
  league: string
  startsAt: Date

  // Bet details
  market: 'moneyline' | 'spread' | 'total'
  side: 'home' | 'away' | 'over' | 'under'
  teamName?: string

  // The actual odds value selected
  odds: number
}

/**
 * Helper to create a unique key for cart items.
 * A selection is uniquely identified by gameId + market + side.
 */
export const getCartKey = (selection: Pick<CartSelection, 'gameId' | 'market' | 'side'>): string => {
  return `${selection.gameId}-${selection.market}-${selection.side}`
}

export interface CartState {
  selections: CartSelection[]
  addSelection: (selection: CartSelection) => void
  removeSelection: (gameId: string, market: CartSelection['market'], side: CartSelection['side']) => void
  clearCart: () => void
  hasSelection: (gameId: string, market: CartSelection['market'], side: CartSelection['side']) => boolean
}

const useCartStore = create<CartState>((set, get) => ({
  selections: [],

  addSelection: (selection) =>
    set((state) => {
      const key = getCartKey(selection)
      // Remove existing selection for this game/market/side if it exists, then add the new one
      const filtered = state.selections.filter((s) => getCartKey(s) !== key)
      return { selections: [...filtered, selection] }
    }),

  removeSelection: (gameId, market, side) =>
    set((state) => ({
      selections: state.selections.filter((s) => getCartKey(s) !== getCartKey({ gameId, market, side })),
    })),

  clearCart: () => set({ selections: [] }),

  hasSelection: (gameId, market, side) => {
    const key = getCartKey({ gameId, market, side })
    return get().selections.some((s) => getCartKey(s) === key)
  },
}))

export default useCartStore
