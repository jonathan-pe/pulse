import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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

/**
 * Calculate implied probability from American odds
 */
export const calculateImpliedProbability = (odds: number): number => {
  if (odds < 0) {
    return (Math.abs(odds) / (Math.abs(odds) + 100)) * 100
  } else {
    return (100 / (odds + 100)) * 100
  }
}

/**
 * Calculate base points for a prediction
 * Formula: 10 × (100 / ImpliedProbability)
 */
export const calculateBasePoints = (odds: number): number => {
  const impliedProb = calculateImpliedProbability(odds)
  return 10 * (100 / impliedProb)
}

/**
 * Calculate potential points for a cart selection
 * Note: This doesn't include streak bonuses as those are only applied to bonus tier predictions
 */
export const calculateSelectionPoints = (selection: CartSelection): number => {
  return Math.round(calculateBasePoints(selection.odds))
}

export interface CartState {
  selections: CartSelection[]
  isOpen: boolean
  addSelection: (selection: CartSelection) => void
  removeSelection: (gameId: string, market: CartSelection['market'], side: CartSelection['side']) => void
  clearCart: () => void
  hasSelection: (gameId: string, market: CartSelection['market'], side: CartSelection['side']) => boolean
  toggleCart: () => void
  setCartOpen: (open: boolean) => void
}

const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      selections: [],
      isOpen: false,

      addSelection: (selection) =>
        set((state) => {
          const key = getCartKey(selection)
          // Check if this exact selection already exists
          const existingIndex = state.selections.findIndex((s) => getCartKey(s) === key)

          // If it exists, remove it (toggle off)
          if (existingIndex !== -1) {
            return {
              selections: state.selections.filter((s) => getCartKey(s) !== key),
            }
          }

          // Otherwise, remove any conflicting selection for the same game + market and add the new one
          const filtered = state.selections.filter(
            (s) => !(s.gameId === selection.gameId && s.market === selection.market)
          )
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

      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      setCartOpen: (open) => set({ isOpen: open }),
    }),
    {
      name: 'pulse-cart-storage',
      partialize: (state) => ({ selections: state.selections }),
    }
  )
)

export default useCartStore
