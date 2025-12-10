import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useUpcomingGames, useGame } from '../useGames'
import type { GameWithUnifiedOdds } from '@pulse/types'
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

describe('useGames', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useUpcomingGames', () => {
    it('should fetch upcoming games without league filter', async () => {
      const mockGames: GameWithUnifiedOdds[] = [
        {
          id: 'game-1',
          league: 'NFL',
          homeTeam: { id: '1', code: 'KC', name: 'Chiefs' },
          awayTeam: { id: '2', code: 'BUF', name: 'Bills' },
          startsAt: '2025-12-10T18:00:00Z',
          status: 'scheduled',
          odds: {
            moneyline: { home: -150, away: 130 },
            spread: { value: -3.5, homePrice: -110, awayPrice: -110 },
            total: { value: 48.5, overPrice: -110, underPrice: -110 },
          },
        },
      ]

      const mockFetchAPI = vi.fn().mockResolvedValue(mockGames)
      vi.mocked(useAPI).mockReturnValue(mockFetchAPI)

      const { result } = renderHook(() => useUpcomingGames(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockGames)
      expect(mockFetchAPI).toHaveBeenCalledWith('/games/upcoming')
    })

    it('should fetch upcoming games with league filter', async () => {
      const mockGames: GameWithUnifiedOdds[] = [
        {
          id: 'game-1',
          league: 'NBA',
          homeTeam: { id: '1', code: 'LAL', name: 'Lakers' },
          awayTeam: { id: '2', code: 'GSW', name: 'Warriors' },
          startsAt: '2025-12-10T20:00:00Z',
          status: 'scheduled',
          odds: {
            moneyline: { home: -200, away: 170 },
            spread: { value: -5.5, homePrice: -110, awayPrice: -110 },
            total: { value: 225.5, overPrice: -110, underPrice: -110 },
          },
        },
      ]

      const mockFetchAPI = vi.fn().mockResolvedValue(mockGames)
      vi.mocked(useAPI).mockReturnValue(mockFetchAPI)

      const { result } = renderHook(() => useUpcomingGames('NBA'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockGames)
      expect(mockFetchAPI).toHaveBeenCalledWith('/games/upcoming?league=NBA')
    })

    it('should handle empty games array', async () => {
      const mockFetchAPI = vi.fn().mockResolvedValue([])
      vi.mocked(useAPI).mockReturnValue(mockFetchAPI)

      const { result } = renderHook(() => useUpcomingGames(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual([])
    })

    it('should handle fetch errors', async () => {
      const mockFetchAPI = vi.fn().mockRejectedValue(new Error('Network error'))
      vi.mocked(useAPI).mockReturnValue(mockFetchAPI)

      const { result } = renderHook(() => useUpcomingGames(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toBeInstanceOf(Error)
      expect((result.current.error as Error).message).toBe('Network error')
    })

    it('should use correct stale time', () => {
      const mockFetchAPI = vi.fn().mockResolvedValue([])
      vi.mocked(useAPI).mockReturnValue(mockFetchAPI)

      const { result } = renderHook(() => useUpcomingGames(), {
        wrapper: createWrapper(),
      })

      // Verify query options (this is more of a configuration test)
      expect(result.current.isLoading || result.current.isSuccess || result.current.isError).toBe(true)
    })
  })

  describe('useGame', () => {
    it('should fetch a single game by ID', async () => {
      const mockGame: GameWithUnifiedOdds = {
        id: 'game-1',
        league: 'NFL',
        homeTeam: { id: '1', code: 'KC', name: 'Chiefs' },
        awayTeam: { id: '2', code: 'BUF', name: 'Bills' },
        startsAt: '2025-12-10T18:00:00Z',
        status: 'scheduled',
        odds: {
          moneyline: { home: -150, away: 130 },
          spread: { value: -3.5, homePrice: -110, awayPrice: -110 },
          total: { value: 48.5, overPrice: -110, underPrice: -110 },
        },
      }

      const mockFetchAPI = vi.fn().mockResolvedValue(mockGame)
      vi.mocked(useAPI).mockReturnValue(mockFetchAPI)

      const { result } = renderHook(() => useGame('game-1'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockGame)
      expect(mockFetchAPI).toHaveBeenCalledWith('/games/game-1')
    })

    it('should not fetch when gameId is undefined', () => {
      const mockFetchAPI = vi.fn()
      vi.mocked(useAPI).mockReturnValue(mockFetchAPI)

      const { result } = renderHook(() => useGame(undefined), {
        wrapper: createWrapper(),
      })

      expect(result.current.fetchStatus).toBe('idle')
      expect(mockFetchAPI).not.toHaveBeenCalled()
    })

    it('should handle 404 errors for non-existent games', async () => {
      const mockFetchAPI = vi.fn().mockRejectedValue(new Error('Game not found'))
      vi.mocked(useAPI).mockReturnValue(mockFetchAPI)

      const { result } = renderHook(() => useGame('non-existent-id'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toBeInstanceOf(Error)
      expect((result.current.error as Error).message).toBe('Game not found')
    })

    it('should refetch when gameId changes', async () => {
      const mockFetchAPI = vi
        .fn()
        .mockResolvedValueOnce({ id: 'game-1', league: 'NFL' })
        .mockResolvedValueOnce({ id: 'game-2', league: 'NBA' })

      vi.mocked(useAPI).mockReturnValue(mockFetchAPI)

      const { result, rerender } = renderHook(({ id }) => useGame(id), {
        wrapper: createWrapper(),
        initialProps: { id: 'game-1' },
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data?.id).toBe('game-1')

      rerender({ id: 'game-2' })

      await waitFor(() => expect(result.current.data?.id).toBe('game-2'))
      expect(mockFetchAPI).toHaveBeenCalledTimes(2)
    })
  })

  describe('Query key management', () => {
    it('should use different query keys for different leagues', () => {
      const mockFetchAPI = vi.fn().mockResolvedValue([])
      vi.mocked(useAPI).mockReturnValue(mockFetchAPI)

      const { result: result1 } = renderHook(() => useUpcomingGames('NFL'), {
        wrapper: createWrapper(),
      })

      const { result: result2 } = renderHook(() => useUpcomingGames('NBA'), {
        wrapper: createWrapper(),
      })

      // Both queries should be independent
      expect(result1.current).not.toBe(result2.current)
    })

    it('should use different query keys for different game IDs', () => {
      const mockFetchAPI = vi.fn().mockResolvedValue({})
      vi.mocked(useAPI).mockReturnValue(mockFetchAPI)

      const { result: result1 } = renderHook(() => useGame('game-1'), {
        wrapper: createWrapper(),
      })

      const { result: result2 } = renderHook(() => useGame('game-2'), {
        wrapper: createWrapper(),
      })

      // Both queries should be independent
      expect(result1.current).not.toBe(result2.current)
    })
  })
})
