import { QueryClient } from '@tanstack/react-query'

/**
 * Query Keys - Use these with TanStack Query for consistent cache management
 */
export const queryKeys = {
  games: {
    all: ['games'] as const,
    upcoming: (league?: string) => ['games', 'upcoming', league] as const,
    byId: (id: string) => ['games', 'detail', id] as const,
  },
  predictions: {
    all: ['predictions'] as const,
    dailyStats: () => ['predictions', 'dailyStats'] as const,
    pending: () => ['predictions', 'pending'] as const,
    history: () => ['predictions', 'history'] as const,
    byGame: () => ['predictions', 'byGame'] as const,
  },
  points: {
    all: ['points'] as const,
    me: () => ['points', 'me'] as const,
    leaderboard: (limit?: number) => ['points', 'leaderboard', limit] as const,
  },
  auth: {
    all: ['auth'] as const,
    me: () => ['auth', 'me'] as const,
  },
}

/**
 * Query Client
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
})
