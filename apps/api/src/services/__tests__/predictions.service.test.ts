/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PredictionsService } from '../predictions.service'

// Mock the @/lib/db module
vi.mock('@/lib/db', () => ({
  prisma: {
    prediction: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
    game: {
      findUnique: vi.fn(),
    },
    gameOdds: {
      findMany: vi.fn(),
    },
  },
}))

// Import the mocked prisma after mocking
import { prisma } from '@/lib/db'

describe('PredictionsService', () => {
  let service: PredictionsService

  beforeEach(() => {
    service = new PredictionsService()
    vi.clearAllMocks()
  })

  describe('getDailyStats', () => {
    it('should calculate daily stats correctly with no predictions', async () => {
      vi.mocked(prisma.prediction.count).mockResolvedValue(0)

      const stats = await service.getDailyStats('user-123')

      expect(stats).toEqual({
        totalToday: 0,
        totalRemaining: 100,
      })
    })

    it('should calculate daily stats with predictions', async () => {
      vi.mocked(prisma.prediction.count).mockResolvedValue(3)

      const stats = await service.getDailyStats('user-123')

      expect(stats).toEqual({
        totalToday: 3,
        totalRemaining: 97,
      })
    })

    it('should handle limit reached', async () => {
      vi.mocked(prisma.prediction.count).mockResolvedValue(100)

      const stats = await service.getDailyStats('user-123')

      expect(stats).toEqual({
        totalToday: 100,
        totalRemaining: 0,
      })
    })
  })

  describe('validatePrediction', () => {
    it('should return error if game not found', async () => {
      vi.mocked(prisma.game.findUnique).mockResolvedValue(null)

      const error = await service.validatePrediction({
        userId: 'user-123',
        gameId: 'game-456',
        type: 'MONEYLINE',
        pick: 'home',
      })

      expect(error).toEqual({
        field: 'gameId',
        message: 'Game not found',
      })
    })

    it('should return error if game has started', async () => {
      const pastDate = new Date()
      pastDate.setHours(pastDate.getHours() - 2)

      vi.mocked(prisma.game.findUnique).mockResolvedValue({
        id: 'game-456',
        startsAt: pastDate,
        status: 'in-progress',
      } as any)

      const error = await service.validatePrediction({
        userId: 'user-123',
        gameId: 'game-456',
        type: 'MONEYLINE',
        pick: 'home',
      })

      expect(error).toEqual({
        field: 'gameId',
        message: 'Game has already started or finished',
      })
    })

    it('should return error if exact duplicate prediction exists', async () => {
      const futureDate = new Date()
      futureDate.setHours(futureDate.getHours() + 2)

      vi.mocked(prisma.game.findUnique).mockResolvedValue({
        id: 'game-456',
        startsAt: futureDate,
        status: 'scheduled',
      } as any)

      // Mock finding an exact duplicate (same game, type, and pick)
      vi.mocked(prisma.prediction.findFirst).mockResolvedValue({
        id: 'pred-123',
        userId: 'user-123',
        gameId: 'game-456',
        type: 'MONEYLINE',
        pick: 'home',
      } as any)

      const error = await service.validatePrediction({
        userId: 'user-123',
        gameId: 'game-456',
        type: 'MONEYLINE',
        pick: 'home',
      })

      expect(error).toEqual({
        field: 'pick',
        message: 'You already have this exact prediction',
      })
    })

    it('should return error for invalid moneyline pick', async () => {
      const futureDate = new Date()
      futureDate.setHours(futureDate.getHours() + 2)

      vi.mocked(prisma.game.findUnique).mockResolvedValue({
        id: 'game-456',
        startsAt: futureDate,
        status: 'scheduled',
      } as any)

      vi.mocked(prisma.prediction.findFirst).mockResolvedValue(null)

      const error = await service.validatePrediction({
        userId: 'user-123',
        gameId: 'game-456',
        type: 'MONEYLINE',
        pick: 'invalid',
      })

      expect(error).toEqual({
        field: 'pick',
        message: 'Moneyline pick must be "home" or "away"',
      })
    })

    it('should return error for invalid spread pick', async () => {
      const futureDate = new Date()
      futureDate.setHours(futureDate.getHours() + 2)

      vi.mocked(prisma.game.findUnique).mockResolvedValue({
        id: 'game-456',
        startsAt: futureDate,
        status: 'scheduled',
      } as any)

      vi.mocked(prisma.prediction.findFirst).mockResolvedValue(null)

      const error = await service.validatePrediction({
        userId: 'user-123',
        gameId: 'game-456',
        type: 'SPREAD',
        pick: 'invalid',
      })

      expect(error).toEqual({
        field: 'pick',
        message: 'Spread pick must be "home" or "away"',
      })
    })

    it('should return error for invalid total pick', async () => {
      const futureDate = new Date()
      futureDate.setHours(futureDate.getHours() + 2)

      vi.mocked(prisma.game.findUnique).mockResolvedValue({
        id: 'game-456',
        startsAt: futureDate,
        status: 'scheduled',
      } as any)

      vi.mocked(prisma.prediction.findFirst).mockResolvedValue(null)

      const error = await service.validatePrediction({
        userId: 'user-123',
        gameId: 'game-456',
        type: 'TOTAL',
        pick: 'invalid',
      })

      expect(error).toEqual({
        field: 'pick',
        message: 'Total pick must be "over" or "under"',
      })
    })

    it('should return null for valid prediction', async () => {
      const futureDate = new Date()
      futureDate.setHours(futureDate.getHours() + 2)

      vi.mocked(prisma.game.findUnique).mockResolvedValue({
        id: 'game-456',
        startsAt: futureDate,
        status: 'scheduled',
      } as any)

      vi.mocked(prisma.prediction.findFirst).mockResolvedValue(null)

      const error = await service.validatePrediction({
        userId: 'user-123',
        gameId: 'game-456',
        type: 'MONEYLINE',
        pick: 'home',
      })

      expect(error).toBeNull()
    })
  })

  describe('createPrediction', () => {
    it('should create a prediction successfully', async () => {
      const futureDate = new Date()
      futureDate.setHours(futureDate.getHours() + 2)

      // Mock validation passing
      vi.mocked(prisma.game.findUnique).mockResolvedValue({
        id: 'game-456',
        startsAt: futureDate,
        status: 'scheduled',
      } as any)

      vi.mocked(prisma.prediction.findFirst).mockResolvedValue(null)

      // Mock daily stats - some predictions already made
      vi.mocked(prisma.prediction.count).mockResolvedValue(5)

      // Mock gameOdds for odds aggregation
      vi.mocked(prisma.gameOdds.findMany).mockResolvedValue([])

      // Mock creation
      vi.mocked(prisma.prediction.create).mockResolvedValue({
        id: 'pred-789',
        userId: 'user-123',
        gameId: 'game-456',
        type: 'MONEYLINE',
        pick: 'home',
        createdAt: new Date(),
        lockedAt: null,
      } as any)

      const result = await service.createPrediction({
        userId: 'user-123',
        gameId: 'game-456',
        type: 'MONEYLINE',
        pick: 'home',
      })

      expect(result.id).toBe('pred-789')
      expect(result.pick).toBe('home')
    })

    it('should throw error when daily limit reached', async () => {
      const futureDate = new Date()
      futureDate.setHours(futureDate.getHours() + 2)

      vi.mocked(prisma.game.findUnique).mockResolvedValue({
        id: 'game-456',
        startsAt: futureDate,
        status: 'scheduled',
      } as any)

      vi.mocked(prisma.prediction.findFirst).mockResolvedValue(null)

      // Mock daily stats - 100 predictions already made
      vi.mocked(prisma.prediction.count).mockResolvedValue(100)

      await expect(
        service.createPrediction({
          userId: 'user-123',
          gameId: 'game-456',
          type: 'MONEYLINE',
          pick: 'home',
        })
      ).rejects.toThrow('Daily prediction limit reached (100)')
    })
  })

  describe('createPredictions (batch)', () => {
    it('should create multiple predictions successfully', async () => {
      const futureDate = new Date()
      futureDate.setHours(futureDate.getHours() + 2)

      // Mock validation passing for all
      vi.mocked(prisma.game.findUnique).mockResolvedValue({
        id: 'game-456',
        startsAt: futureDate,
        status: 'scheduled',
      } as any)

      vi.mocked(prisma.prediction.findFirst).mockResolvedValue(null)

      // Mock no existing predictions today
      vi.mocked(prisma.prediction.count).mockResolvedValue(0)

      // Mock gameOdds for odds aggregation
      vi.mocked(prisma.gameOdds.findMany).mockResolvedValue([])

      // Mock creation
      vi.mocked(prisma.prediction.create)
        .mockResolvedValueOnce({
          id: 'pred-1',
          userId: 'user-123',
          gameId: 'game-1',
          type: 'MONEYLINE',
          pick: 'home',
          createdAt: new Date(),
          lockedAt: null,
        } as any)
        .mockResolvedValueOnce({
          id: 'pred-2',
          userId: 'user-123',
          gameId: 'game-2',
          type: 'SPREAD',
          pick: 'away',
          createdAt: new Date(),
          lockedAt: null,
        } as any)

      const result = await service.createPredictions('user-123', [
        { gameId: 'game-1', type: 'MONEYLINE', pick: 'home' },
        { gameId: 'game-2', type: 'SPREAD', pick: 'away' },
      ])

      expect(result.created).toHaveLength(2)
      expect(result.errors).toHaveLength(0)
    })

    it('should handle validation errors in batch', async () => {
      const futureDate = new Date()
      futureDate.setHours(futureDate.getHours() + 2)

      // First game valid, second game not found
      vi.mocked(prisma.game.findUnique)
        .mockResolvedValueOnce({
          id: 'game-1',
          startsAt: futureDate,
          status: 'scheduled',
        } as any)
        .mockResolvedValueOnce(null)

      vi.mocked(prisma.prediction.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.prediction.count).mockResolvedValue(0)

      // Mock gameOdds for odds aggregation
      vi.mocked(prisma.gameOdds.findMany).mockResolvedValue([])

      vi.mocked(prisma.prediction.create).mockResolvedValue({
        id: 'pred-1',
        userId: 'user-123',
        gameId: 'game-1',
        type: 'MONEYLINE',
        pick: 'home',
        createdAt: new Date(),
        lockedAt: null,
      } as any)

      const result = await service.createPredictions('user-123', [
        { gameId: 'game-1', type: 'MONEYLINE', pick: 'home' },
        { gameId: 'game-2', type: 'MONEYLINE', pick: 'home' },
      ])

      expect(result.created).toHaveLength(1)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toEqual({
        gameId: 'game-2',
        error: 'Game not found',
      })
    })

    it('should respect daily limits in batch', async () => {
      const futureDate = new Date()
      futureDate.setHours(futureDate.getHours() + 2)

      vi.mocked(prisma.game.findUnique).mockResolvedValue({
        id: 'game-456',
        startsAt: futureDate,
        status: 'scheduled',
      } as any)

      vi.mocked(prisma.prediction.findFirst).mockResolvedValue(null)

      // Mock 99 existing predictions
      vi.mocked(prisma.prediction.count).mockResolvedValue(99)

      // Mock gameOdds for odds aggregation
      vi.mocked(prisma.gameOdds.findMany).mockResolvedValue([])

      vi.mocked(prisma.prediction.create).mockResolvedValue({
        id: 'pred-1',
        userId: 'user-123',
        gameId: 'game-1',
        type: 'MONEYLINE',
        pick: 'home',
        createdAt: new Date(),
        lockedAt: null,
      } as any)

      const result = await service.createPredictions('user-123', [
        { gameId: 'game-1', type: 'MONEYLINE', pick: 'home' },
        { gameId: 'game-2', type: 'MONEYLINE', pick: 'home' },
        { gameId: 'game-3', type: 'MONEYLINE', pick: 'home' },
      ])

      // Only first prediction should succeed (reaching limit of 100)
      expect(result.created).toHaveLength(1)
      expect(result.errors).toHaveLength(2)
      expect(result.errors[0].error).toContain('Daily prediction limit reached')
    })
  })

  describe('lockPredictionsForGame', () => {
    it('should lock all predictions for a game', async () => {
      vi.mocked(prisma.prediction.updateMany).mockResolvedValue({ count: 5 } as any)

      const result = await service.lockPredictionsForGame('game-123')

      expect(result.count).toBe(5)
      expect(vi.mocked(prisma.prediction.updateMany)).toHaveBeenCalledWith({
        where: {
          gameId: 'game-123',
          lockedAt: null,
        },
        data: {
          lockedAt: expect.any(Date),
        },
      })
    })
  })
})
