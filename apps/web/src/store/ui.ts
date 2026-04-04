import { create } from 'zustand'

/**
 * UI preferences (home feed sort, grouping, etc.).
 * Table vs cards toggle was removed; persist and additional fields land in a later batch.
 */
export interface UIState {}

const useUIStore = create<UIState>(() => ({}))

export default useUIStore
