/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PointsService } from '../points.service'

// Mock the @/lib/db module
vi.mock('@/lib/db', () => ({
  prisma: {
    pointsLedger: {
      findMany: vi.fn(),
      aggregate: vi.fn(),
      groupBy: vi.fn(),
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    prediction: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}))

// Import the mocked prisma after mocking
import { prisma } from '@/lib/db'

describe('PointsService', () => {
  let service: PointsService

  beforeEach(() => {
    service = new PointsService()
    vi.clearAllMocks()
  })

  describe('getUserPoints', () => {
    it('should return total points for a user', async () => {
      vi.mocked(prisma.pointsLedger.aggregate).mockResolvedValue({
        _sum: { delta: 1250 },
      } as any)

      const points = await service.getUserPoints('user-123')

      expect(points).toBe(1250)
      expect(prisma.pointsLedger.aggregate).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        _sum: { delta: true },
      })
    })

    it('should return 0 if user has no points', async () => {
      vi.mocked(prisma.pointsLedger.aggregate).mockResolvedValue({
        _sum: { delta: null },
      } as any)

      const points = await service.getUserPoints('user-123')

      expect(points).toBe(0)
    })
  })

  describe('getPointsHistory', () => {
    it('should return paginated points history', async () => {
      const mockHistory = [
        {
          id: 'ledger-1',
          delta: 25,
          reason: 'Correct prediction',
          meta: { predictionId: 'pred-1' },
          createdAt: new Date('2024-03-20'),
        },
        {
          id: 'ledger-2',
          delta: 30,
          reason: 'Correct prediction',
          meta: { predictionId: 'pred-2' },
          createdAt: new Date('2024-03-19'),
        },
      ]

      vi.mocked(prisma.pointsLedger.findMany).mockResolvedValue(mockHistory as any)

      const history = await service.getPointsHistory('user-123', 10, 0)

      expect(history).toEqual(mockHistory)
      expect(prisma.pointsLedger.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 0,
        select: {
          id: true,
          delta: true,
          reason: true,
          meta: true,
          createdAt: true,
        },
      })
    })

    it('should apply pagination correctly', async () => {
      vi.mocked(prisma.pointsLedger.findMany).mockResolvedValue([])

      await service.getPointsHistory('user-123', 50, 100)

      expect(prisma.pointsLedger.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
          skip: 100,
        })
      )
    })
  })

  describe('getWinRateByLeague', () => {
    it('should return win rate breakdown by league', async () => {
      const mockPredictions = [
        {
          isCorrect: true,
          game: { league: 'NBA' },
        },
        {
          isCorrect: false,
          game: { league: 'NBA' },
        },
        {
          isCorrect: true,
          game: { league: 'NFL' },
        },
        {
          isCorrect: true,
          game: { league: 'NFL' },
        },
        {
          isCorrect: true,
          game: { league: 'NFL' },
        },
      ]

      const mockLedger = [
        { delta: 20, meta: { league: 'NBA' } },
        { delta: 25, meta: { league: 'NFL' } },
        { delta: 30, meta: { league: 'NFL' } },
      ]

      vi.mocked(prisma.prediction.findMany).mockResolvedValue(mockPredictions as any)
      vi.mocked(prisma.pointsLedger.groupBy).mockResolvedValue([])
      vi.mocked(prisma.pointsLedger.findMany).mockResolvedValue(mockLedger as any)

      const stats = await service.getWinRateByLeague('user-123')

      expect(stats).toHaveLength(2)

      const nbaStats = stats.find((s) => s.league === 'NBA')
      expect(nbaStats).toEqual({
        league: 'NBA',
        totalPredictions: 2,
        correctPredictions: 1,
        winRate: 0.5,
        pointsEarned: 20,
      })

      const nflStats = stats.find((s) => s.league === 'NFL')
      expect(nflStats).toEqual({
        league: 'NFL',
        totalPredictions: 3,
        correctPredictions: 3,
        winRate: 1.0,
        pointsEarned: 55,
      })
    })

    it('should return empty array for users with no predictions', async () => {
      vi.mocked(prisma.prediction.findMany).mockResolvedValue([])
      vi.mocked(prisma.pointsLedger.groupBy).mockResolvedValue([])
      vi.mocked(prisma.pointsLedger.findMany).mockResolvedValue([])

      const stats = await service.getWinRateByLeague('user-123')

      expect(stats).toEqual([])
    })
  })

  describe('getPointsOverTime', () => {
    it('should return daily points aggregation', async () => {
      const mockEntries = [
        {
          delta: 25,
          createdAt: new Date('2024-03-20T10:00:00Z'),
          reason: 'Correct prediction',
        },
        {
          delta: 30,
          createdAt: new Date('2024-03-20T14:00:00Z'),
          reason: 'Correct prediction',
        },
        {
          delta: 15,
          createdAt: new Date('2024-03-19T10:00:00Z'),
          reason: 'Correct prediction',
        },
      ]

      vi.mocked(prisma.pointsLedger.findMany).mockResolvedValue(mockEntries as any)

      const timeSeries = await service.getPointsOverTime('user-123', 7)

      expect(timeSeries).toEqual([
        { date: '2024-03-19', pointsEarned: 15, predictionsScored: 1 },
        { date: '2024-03-20', pointsEarned: 55, predictionsScored: 2 },
      ])
    })

    it('should filter by date range', async () => {
      vi.mocked(prisma.pointsLedger.findMany).mockResolvedValue([])

      await service.getPointsOverTime('user-123', 30)

      const callArgs = vi.mocked(prisma.pointsLedger.findMany).mock.calls[0][0]
      expect(callArgs?.where?.createdAt).toBeDefined()
    })
  })

  describe('getLongestStreak', () => {
    it('should calculate longest streak correctly', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-123',
        longestStreak: 3,
      } as any)

      const longestStreak = await service.getLongestStreak('user-123')

      expect(longestStreak).toBe(3)
    })

    it('should return 0 for no predictions', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-123',
        longestStreak: 0,
      } as any)

      const longestStreak = await service.getLongestStreak('user-123')

      expect(longestStreak).toBe(0)
    })

    it('should handle perfect streak', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-123',
        longestStreak: 5,
      } as any)

      const longestStreak = await service.getLongestStreak('user-123')

      expect(longestStreak).toBe(5)
    })
  })

  describe('getUserStats', () => {
    it('should return comprehensive user statistics', async () => {
      // Mock user with current streak - will be called twice (once for currentStreak, once for longestStreak)
      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce({
          id: 'user-123',
          currentStreak: 5,
        } as any)
        .mockResolvedValueOnce({
          id: 'user-123',
          longestStreak: 2,
        } as any)

      // Mock total points
      vi.mocked(prisma.pointsLedger.aggregate).mockResolvedValue({
        _sum: { delta: 1250 },
      } as any)

      // Mock all predictions - need to return consistent data for all calls
      const allPredictions = [
        { isCorrect: true, game: { league: 'NBA' } },
        { isCorrect: true, game: { league: 'NBA' } },
        { isCorrect: false, game: { league: 'NBA' } },
      ]

      vi.mocked(prisma.prediction.findMany).mockResolvedValue(allPredictions as any)

      // Mock today's stats
      vi.mocked(prisma.pointsLedger.findMany).mockResolvedValue([])
      vi.mocked(prisma.pointsLedger.groupBy).mockResolvedValue([])

      vi.mocked(prisma.prediction.count)
        .mockResolvedValueOnce(3) // total today
        .mockResolvedValueOnce(2) // bonus tier used

      // Mock rank calculation
      vi.mocked(prisma.$queryRaw).mockResolvedValue([{ count: BigInt(23) }] as any)

      const stats = await service.getUserStats('user-123')

      expect(stats).toMatchObject({
        totalPoints: 1250,
        currentStreak: 5,
        longestStreak: 2, // From user record
        totalPredictions: 3,
        correctPredictions: 2,
        overallWinRate: expect.closeTo(0.667, 2),
        predictionsToday: 3,
        bonusTierUsed: 2,
        leaderboardRank: 24,
      })

      expect(stats.byLeague).toBeInstanceOf(Array)
      expect(stats.pointsOverTime).toBeInstanceOf(Array)
    })

    it('should handle users with no data', async () => {
      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce({
          id: 'user-123',
          currentStreak: 0,
        } as any)
        .mockResolvedValueOnce({
          id: 'user-123',
          longestStreak: 0,
        } as any)

      vi.mocked(prisma.pointsLedger.aggregate).mockResolvedValue({
        _sum: { delta: null }, // null when no records
      } as any)

      vi.mocked(prisma.prediction.findMany).mockResolvedValue([])
      vi.mocked(prisma.prediction.count).mockResolvedValue(0)
      vi.mocked(prisma.pointsLedger.findMany).mockResolvedValue([])
      vi.mocked(prisma.pointsLedger.groupBy).mockResolvedValue([])
      vi.mocked(prisma.$queryRaw).mockResolvedValue([{ count: BigInt(0) }] as any)

      const stats = await service.getUserStats('user-123')

      expect(stats).toMatchObject({
        totalPoints: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalPredictions: 0,
        correctPredictions: 0,
        overallWinRate: 0,
        predictionsToday: 0,
        bonusTierUsed: 0,
        leaderboardRank: null, // No rank if no points
        byLeague: [],
        pointsOverTime: [],
      })
    })
  })

  describe('awardPoints', () => {
    it('should create a points ledger entry', async () => {
      vi.mocked(prisma.pointsLedger.create).mockResolvedValue({
        id: 'ledger-123',
        userId: 'user-123',
        delta: 25,
        reason: 'Correct prediction',
        meta: {},
        createdAt: new Date(),
      } as any)

      await service.awardPoints('user-123', 25, 'Correct prediction', {
        predictionId: 'pred-456',
      })

      expect(prisma.pointsLedger.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          delta: 25,
          reason: 'Correct prediction',
          meta: { predictionId: 'pred-456' },
        },
      })
    })
  })

  describe('updateUserStreak', () => {
    it('should increment streak for correct bonus tier prediction', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-123',
        currentStreak: 3,
        longestStreak: 3,
      } as any)

      vi.mocked(prisma.user.update).mockResolvedValue({
        id: 'user-123',
        currentStreak: 4,
        longestStreak: 4,
      } as any)

      const newStreak = await service.updateUserStreak('user-123', true, true)

      expect(newStreak).toBe(4)
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { currentStreak: 4, longestStreak: 4 },
      })
    })

    it('should reset streak for incorrect bonus tier prediction', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-123',
        currentStreak: 5,
      } as any)

      vi.mocked(prisma.user.update).mockResolvedValue({
        id: 'user-123',
        currentStreak: 0,
      } as any)

      const newStreak = await service.updateUserStreak('user-123', false, true)

      expect(newStreak).toBe(0)
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { currentStreak: 0 },
      })
    })

    it('should not affect streak for non-bonus tier predictions', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-123',
        currentStreak: 3,
      } as any)

      const newStreak = await service.updateUserStreak('user-123', true, false)

      expect(newStreak).toBe(3)
      expect(prisma.user.update).not.toHaveBeenCalled()
    })
  })
})
