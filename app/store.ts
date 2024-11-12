// app/store.ts
import { Sportsbook } from '@/types/sportsbook'
import { League } from '@/types/league'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  sportsbook: Sportsbook | null
  setSportsbook: (sportsbook: Sportsbook | null) => void

  league: League | null
  setLeague: (league: League | null) => void
}

const UNPERSISTED_KEYS = ['league']

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sportsbook: null,
      setSportsbook: (sportsbook) => set({ sportsbook }),

      league: null,
      setLeague: (league) => set({ league }),
    }),
    {
      partialize: (state) =>
        Object.fromEntries(Object.entries(state).filter(([key]) => !UNPERSISTED_KEYS.includes(key))),
      name: 'appStore',
    }
  )
)
