import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useMyPoints, usePointsHistory, useLeaderboard, useUserStats } from '../usePoints'
import type { PointsLedgerEntry, LeaderboardEntry, UserStats } from '@pulse/types'
import { useAPI } from '../useAPI'

// Mock the useAPI hook
vi.mock('../useAPI', () => ({
  useAPI: vi.fn(),
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('usePoints', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useMyPoints', () => {
    it('should fetch current user points', async () => {
      const mockFetchAPI = vi.fn().mockResolvedValue({ points: 125.5 })
      vi.mocked(useAPI).mockReturnValue(mockFetchAPI)

      const { result } = renderHook(() => useMyPoints(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toBe(125.5)
      expect(mockFetchAPI).toHaveBeenCalledWith('/points/me')
    })

    it('should handle zero points', async () => {
      const mockFetchAPI = vi.fn().mockResolvedValue({ points: 0 })
      vi.mocked(useAPI).mockReturnValue(mockFetchAPI)

      const { result } = renderHook(() => useMyPoints(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toBe(0)
    })

    it('should handle negative points', async () => {
      const mockFetchAPI = vi.fn().mockResolvedValue({ points: -15.5 })
      vi.mocked(useAPI).mockReturnValue(mockFetchAPI)

      const { result } = renderHook(() => useMyPoints(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toBe(-15.5)
    })

    it('should handle fetch errors', async () => {
      const mockFetchAPI = vi.fn().mockRejectedValue(new Error('Unauthorized'))
      vi.mocked(useAPI).mockReturnValue(mockFetchAPI)

      const { result } = renderHook(() => useMyPoints(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toBeInstanceOf(Error)
    })
  })

  describe('usePointsHistory', () => {
    it('should fetch points history with default pagination', async () => {
      const mockHistory: PointsLedgerEntry[] = [
        {
          id: '1',
          delta: 15.5,
          reason: 'Correct prediction',
          meta: { predictionId: 'pred-1' },
          createdAt: '2025-12-09T10:00:00Z',
        },
        {
          id: '2',
          delta: -3.3,
          reason: 'Incorrect prediction',
          meta: { predictionId: 'pred-2' },
          createdAt: '2025-12-09T09:00:00Z',
        },
      ]

      const mockFetchAPI = vi.fn().mockResolvedValue(mockHistory)
      vi.mocked(useAPI).mockReturnValue(mockFetchAPI)

      const { result } = renderHook(() => usePointsHistory(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockHistory)
      expect(mockFetchAPI).toHaveBeenCalledWith('/points/history?limit=100&offset=0')
    })

    it('should fetch points history with custom pagination', async () => {
      const mockHistory: PointsLedgerEntry[] = []
      const mockFetchAPI = vi.fn().mockResolvedValue(mockHistory)
      vi.mocked(useAPI).mockReturnValue(mockFetchAPI)

      const { result } = renderHook(() => usePointsHistory(50, 100), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(mockFetchAPI).toHaveBeenCalledWith('/points/history?limit=50&offset=100')
    })

    it('should handle empty history', async () => {
      const mockFetchAPI = vi.fn().mockResolvedValue([])
      vi.mocked(useAPI).mockReturnValue(mockFetchAPI)

      const { result } = renderHook(() => usePointsHistory(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual([])
    })

    it('should handle fetch errors', async () => {
      const mockFetchAPI = vi.fn().mockRejectedValue(new Error('Server error'))
      vi.mocked(useAPI).mockReturnValue(mockFetchAPI)

      const { result } = renderHook(() => usePointsHistory(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toBeInstanceOf(Error)
    })
  })

  describe('useLeaderboard', () => {
    it('should fetch all-time leaderboard by default', async () => {
      const mockLeaderboard: LeaderboardEntry[] = [
        {
          rank: 1,
          userId: 'user-1',
          username: 'TopPlayer',
          imageUrl: null,
          points: 500.5,
          rankChange: null,
        },
        {
          rank: 2,
          userId: 'user-2',
          username: 'SecondPlace',
          imageUrl: null,
          points: 450.0,
          rankChange: null,
        },
      ]

      const mockFetchAPI = vi.fn().mockResolvedValue(mockLeaderboard)
      vi.mocked(useAPI).mockReturnValue(mockFetchAPI)

      const { result } = renderHook(() => useLeaderboard(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockLeaderboard)
      expect(mockFetchAPI).toHaveBeenCalledWith('/points/leaderboard?period=alltime&limit=50')
    })

    it('should fetch weekly leaderboard', async () => {
      const mockLeaderboard: LeaderboardEntry[] = [
        {
          rank: 1,
          userId: 'user-3',
          username: 'WeeklyChamp',
          imageUrl: null,
          points: 125.5,
          rankChange: null,
        },
      ]

      const mockFetchAPI = vi.fn().mockResolvedValue(mockLeaderboard)
      vi.mocked(useAPI).mockReturnValue(mockFetchAPI)

      const { result } = renderHook(() => useLeaderboard('weekly'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(mockFetchAPI).toHaveBeenCalledWith('/points/leaderboard?period=weekly&limit=50')
    })

    it('should fetch weekly leaderboard with custom limit', async () => {
      const mockLeaderboard: LeaderboardEntry[] = []
      const mockFetchAPI = vi.fn().mockResolvedValue(mockLeaderboard)
      vi.mocked(useAPI).mockReturnValue(mockFetchAPI)

      const { result } = renderHook(() => useLeaderboard('weekly', 25), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(mockFetchAPI).toHaveBeenCalledWith('/points/leaderboard?period=weekly&limit=25')
    })

    it('should respect custom limit', async () => {
      const mockFetchAPI = vi.fn().mockResolvedValue([])
      vi.mocked(useAPI).mockReturnValue(mockFetchAPI)

      const { result } = renderHook(() => useLeaderboard('alltime', 10), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(mockFetchAPI).toHaveBeenCalledWith('/points/leaderboard?period=alltime&limit=10')
    })

    it('should handle empty leaderboard', async () => {
      const mockFetchAPI = vi.fn().mockResolvedValue([])
      vi.mocked(useAPI).mockReturnValue(mockFetchAPI)

      const { result } = renderHook(() => useLeaderboard(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual([])
    })

    it('should handle fetch errors', async () => {
      const mockFetchAPI = vi.fn().mockRejectedValue(new Error('Network error'))
      vi.mocked(useAPI).mockReturnValue(mockFetchAPI)

      const { result } = renderHook(() => useLeaderboard(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toBeInstanceOf(Error)
    })
  })

  describe('useUserStats', () => {
    it('should fetch comprehensive user statistics', async () => {
      const mockStats: UserStats = {
        totalPoints: 250.5,
        totalPredictions: 50,
        correctPredictions: 30,
        overallWinRate: 0.6,
        currentStreak: 3,
        longestStreak: 5,
        pointsEarnedToday: 25.5,
        predictionsToday: 3,
        bonusTierUsed: 1,
        leaderboardRank: 15,
        byLeague: [],
        pointsOverTime: [],
      }

      const mockFetchAPI = vi.fn().mockResolvedValue(mockStats)
      vi.mocked(useAPI).mockReturnValue(mockFetchAPI)

      const { result } = renderHook(() => useUserStats(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockStats)
      expect(mockFetchAPI).toHaveBeenCalledWith('/points/stats')
    })

    it('should handle new user with no stats', async () => {
      const mockStats: UserStats = {
        totalPoints: 0,
        totalPredictions: 0,
        correctPredictions: 0,
        overallWinRate: 0,
        currentStreak: 0,
        longestStreak: 0,
        pointsEarnedToday: 0,
        predictionsToday: 0,
        bonusTierUsed: 0,
        leaderboardRank: null,
        byLeague: [],
        pointsOverTime: [],
      }

      const mockFetchAPI = vi.fn().mockResolvedValue(mockStats)
      vi.mocked(useAPI).mockReturnValue(mockFetchAPI)

      const { result } = renderHook(() => useUserStats(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockStats)
    })

    it('should handle negative points scenario', async () => {
      const mockStats: UserStats = {
        totalPoints: -25.5,
        totalPredictions: 20,
        correctPredictions: 5,
        overallWinRate: 0.25,
        currentStreak: 0,
        longestStreak: 2,
        pointsEarnedToday: -10.5,
        predictionsToday: 2,
        bonusTierUsed: 1,
        leaderboardRank: 500,
        byLeague: [],
        pointsOverTime: [],
      }

      const mockFetchAPI = vi.fn().mockResolvedValue(mockStats)
      vi.mocked(useAPI).mockReturnValue(mockFetchAPI)

      const { result } = renderHook(() => useUserStats(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockStats)
      expect(result.current.data?.totalPoints).toBeLessThan(0)
    })

    it('should handle fetch errors', async () => {
      const mockFetchAPI = vi.fn().mockRejectedValue(new Error('Failed to load stats'))
      vi.mocked(useAPI).mockReturnValue(mockFetchAPI)

      const { result } = renderHook(() => useUserStats(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toBeInstanceOf(Error)
    })
  })

  describe('Integration scenarios', () => {
    it('should handle complete dashboard data flow', async () => {
      const mockFetchAPI = vi
        .fn()
        .mockResolvedValueOnce({ points: 250.5 }) // useMyPoints
        .mockResolvedValueOnce({
          // useUserStats
          totalPoints: 250.5,
          totalPredictions: 50,
          correctPredictions: 30,
          overallWinRate: 0.6,
          currentStreak: 3,
          longestStreak: 5,
        })

      vi.mocked(useAPI).mockReturnValue(mockFetchAPI)

      const { result: pointsResult } = renderHook(() => useMyPoints(), {
        wrapper: createWrapper(),
      })

      const { result: statsResult } = renderHook(() => useUserStats(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(pointsResult.current.isSuccess).toBe(true)
        expect(statsResult.current.isSuccess).toBe(true)
      })

      expect(pointsResult.current.data).toBe(250.5)
      expect(statsResult.current.data?.totalPoints).toBe(250.5)
      expect(statsResult.current.data?.overallWinRate).toBe(0.6)
    })

    it('should handle pagination for points history', async () => {
      const mockPage1 = [{ id: '1', points: 10 }]
      const mockPage2 = [{ id: '2', points: 15 }]

      const mockFetchAPI = vi.fn().mockResolvedValueOnce(mockPage1).mockResolvedValueOnce(mockPage2)

      vi.mocked(useAPI).mockReturnValue(mockFetchAPI)

      const { result: page1Result } = renderHook(() => usePointsHistory(1, 0), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(page1Result.current.isSuccess).toBe(true))

      const { result: page2Result } = renderHook(() => usePointsHistory(1, 1), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(page2Result.current.isSuccess).toBe(true))

      expect(page1Result.current.data).toEqual(mockPage1)
      expect(page2Result.current.data).toEqual(mockPage2)
    })
  })

  describe('Edge cases', () => {
    it('should handle very large point values', async () => {
      const mockFetchAPI = vi.fn().mockResolvedValue({ points: 999999.99 })
      vi.mocked(useAPI).mockReturnValue(mockFetchAPI)

      const { result } = renderHook(() => useMyPoints(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toBe(999999.99)
    })

    it('should handle fractional points correctly', async () => {
      const mockFetchAPI = vi.fn().mockResolvedValue({ points: 15.567 })
      vi.mocked(useAPI).mockReturnValue(mockFetchAPI)

      const { result } = renderHook(() => useMyPoints(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toBeCloseTo(15.567, 3)
    })

    it('should handle leaderboard with ties', async () => {
      const mockLeaderboard: LeaderboardEntry[] = [
        {
          rank: 1,
          userId: 'user-1',
          username: 'Player1',
          imageUrl: null,
          points: 100.0,
          rankChange: null,
        },
        {
          rank: 1,
          userId: 'user-2',
          username: 'Player2',
          imageUrl: null,
          points: 100.0,
          rankChange: null,
        },
        {
          rank: 3,
          userId: 'user-3',
          username: 'Player3',
          imageUrl: null,
          points: 95.0,
          rankChange: null,
        },
      ]

      const mockFetchAPI = vi.fn().mockResolvedValue(mockLeaderboard)
      vi.mocked(useAPI).mockReturnValue(mockFetchAPI)

      const { result } = renderHook(() => useLeaderboard(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.[0].rank).toBe(1)
      expect(result.current.data?.[1].rank).toBe(1)
      expect(result.current.data?.[2].rank).toBe(3)
    })
  })
})
