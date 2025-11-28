import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/api'
import { useAPI } from '@/hooks/useAPI'
import type { PointsLedgerEntry, LeaderboardEntry, LeaderboardPeriod, UserStats } from '@pulse/types'

/**
 * Get current user's total points
 */
export function useMyPoints() {
  const fetchAPI = useAPI()

  return useQuery({
    queryKey: queryKeys.points.me(),
    queryFn: async () => {
      const data = await fetchAPI<{ points: number }>('/points/me')
      return data.points
    },
  })
}

/**
 * Get paginated points history for the current user
 */
export function usePointsHistory(limit = 100, offset = 0) {
  const fetchAPI = useAPI()

  return useQuery({
    queryKey: queryKeys.points.history(limit, offset),
    queryFn: async () => {
      return fetchAPI<PointsLedgerEntry[]>(`/points/history?limit=${limit}&offset=${offset}`)
    },
  })
}

/**
 * Get leaderboard with optional period filtering
 */
export function useLeaderboard(period: LeaderboardPeriod = 'alltime', limit = 50) {
  const fetchAPI = useAPI()

  return useQuery({
    queryKey: queryKeys.points.leaderboard(period, limit),
    queryFn: async () => {
      return fetchAPI<LeaderboardEntry[]>(`/points/leaderboard?period=${period}&limit=${limit}`)
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - leaderboard updates slowly
  })
}

/**
 * Get comprehensive user statistics
 */
export function useUserStats() {
  const fetchAPI = useAPI()

  return useQuery({
    queryKey: queryKeys.points.stats(),
    queryFn: async () => {
      return fetchAPI<UserStats>('/points/stats')
    },
    refetchInterval: 60 * 1000, // Refetch every 60s for real-time feel
    refetchOnWindowFocus: true,
  })
}
