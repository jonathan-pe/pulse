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

  darkMode: boolean
  setDarkMode: (darkMode: boolean) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sportsbook: null,
      setSportsbook: (sportsbook) => set({ sportsbook }),

      league: null,
      setLeague: (league) => set({ league }),

      darkMode: true,
      setDarkMode: (darkMode) => set({ darkMode }),
    }),
    {
      name: 'appStore',
    }
  )
)
