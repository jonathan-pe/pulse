// app/store.ts
import { Sportsbook } from '@/types/sportsbook'
import { League } from '@/types/league'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from 'next-auth'
import { UserStats } from '@/types/user'
import { Game, Odds_Event } from '@/types/game'

interface AppState {
  sportsbook: Sportsbook | null
  setSportsbook: (sportsbook: Sportsbook | null) => void

  league: League | null
  setLeague: (league: League | null) => void

  user: User | null
  setUser: (user: User | null) => void

  userStats: UserStats | null
  setUserStats: (userStats: UserStats | null) => void

  cart: Odds_Event[] | null
  setCart: (fn: (prev: Odds_Event[]) => Odds_Event[] | null) => void

  game: Game | null
  setGame: (game: Game | null) => void
}

const UNPERSISTED_KEYS = ['league']

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sportsbook: null,
      setSportsbook: (sportsbook) => set({ sportsbook }),

      league: null,
      setLeague: (league) => set({ league }),

      user: null,
      setUser: (user) => set({ user }),

      userStats: null,
      setUserStats: (userStats) => set({ userStats }),

      cart: null,
      setCart: (fn: (prev: Odds_Event[]) => Odds_Event[] | null) => {
        set(({ cart }) => ({ cart: fn(cart ?? []) }))
      },

      game: null,
      setGame: (game) => set({ game }),
    }),
    {
      partialize: (state) =>
        Object.fromEntries(Object.entries(state).filter(([key]) => !UNPERSISTED_KEYS.includes(key))),
      name: 'appStore',
    }
  )
)
