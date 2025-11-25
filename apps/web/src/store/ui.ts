import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ViewMode = 'table' | 'cards'

export interface UIState {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  toggleViewMode: () => void
}

const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      viewMode: 'cards', // Default to cards view (more modern)

      setViewMode: (mode) => set({ viewMode: mode }),

      toggleViewMode: () =>
        set((state) => ({
          viewMode: state.viewMode === 'table' ? 'cards' : 'table',
        })),
    }),
    {
      name: 'pulse-ui-preferences',
    }
  )
)

export default useUIStore
