// app/store.ts
import { Sportsbook } from '@/types/sportsbook'
import { create } from 'zustand'

interface AppState {
  sportsbook: Sportsbook | null
  setSportsbook: (sportsbook: Sportsbook | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  sportsbook: null,
  setSportsbook: (sportsbook) => set({ sportsbook }),
}))
