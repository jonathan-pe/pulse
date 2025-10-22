import type { trpc } from '@/lib/trpc'
import type { inferOutput } from '@trpc/tanstack-react-query'
import { create } from 'zustand'

export type Odd = inferOutput<typeof trpc.games.listUpcoming>[number]['odds'][number] & {
  // Optional convenience fields added when an odd is placed into the cart
  teamName?: string
  side?: 'home' | 'away' | 'over' | 'under' | string
  // The specific price the user selected (e.g. home ML number, chosen spread, or total)
  selectedOdds?: number | null
}

export interface CartState {
  odds: Odd[]
  addOdds: (newOdds: Odd) => void
  removeOdds: (oddsId: string) => void
  clearCart: () => void
}

const useCartStore = create<CartState>((set) => ({
  odds: [],

  addOdds: (newOdds: Odd) =>
    set((state: CartState) => {
      // Prevent adding duplicate odds entries by checking for exact same odds ID
      if (state.odds.find((odds) => odds.id === newOdds.id)) {
        return state
      }
      return { odds: [...state.odds, newOdds] }
    }),

  removeOdds: (oddsId: string) =>
    set((state: CartState) => ({
      odds: state.odds.filter((odds) => odds.id !== oddsId),
    })),

  clearCart: () => set({ odds: [] }),
}))

export default useCartStore
