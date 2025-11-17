import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/api'
import { useAPI } from './useAPI'
import type { GameWithUnifiedOdds } from '@pulse/types'

// ============================================================================
// Query Hooks (GET requests)
// ============================================================================

/**
 * Fetch upcoming games, optionally filtered by league
 * @param league - Optional league filter (e.g., 'MLB', 'NBA', 'NFL', 'NHL')
 */
export const useUpcomingGames = (league?: string) => {
  const fetchAPI = useAPI()

  return useQuery({
    queryKey: queryKeys.games.upcoming(league),
    queryFn: () => {
      const params = new URLSearchParams()
      if (league) params.append('league', league)
      const query = params.toString()
      return fetchAPI<GameWithUnifiedOdds[]>(`/games/upcoming${query ? `?${query}` : ''}`)
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Fetch a single game by ID
 * @param gameId - The game ID to fetch
 */
export const useGame = (gameId: string | undefined) => {
  const fetchAPI = useAPI()

  return useQuery({
    queryKey: queryKeys.games.byId(gameId!),
    queryFn: () => fetchAPI<GameWithUnifiedOdds>(`/games/${gameId}`),
    enabled: !!gameId,
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}
