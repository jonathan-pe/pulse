import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OddsService } from '../odds.service'

// Mock the @pulse/db module
vi.mock('@pulse/db', () => ({
  prisma: {
    gameOdds: {
      upsert: vi.fn(),
    },
  },
}))

// Import the mocked prisma after mocking
import { prisma } from '@pulse/db'

// Helper to create mock odds response
const createMockOdds = (overrides: Record<string, unknown> = {}) => ({
  id: 'odds-123',
  gameId: 'game-123',
  provider: 'natstat',
  market: 'moneyline',
  book: 'draftkings',
  moneylineHome: null,
  moneylineAway: null,
  spread: null,
  total: null,
  updatedAt: new Date(),
  ...overrides,
})

describe('OddsService', () => {
  let service: OddsService

  beforeEach(() => {
    service = new OddsService()
    vi.clearAllMocks()
  })

  describe('upsertOddsLine', () => {
    it('should upsert moneyline odds correctly', async () => {
      const input = {
        gameId: 'game-123',
        provider: 'natstat',
        book: 'draftkings',
        market: 'moneyline' as const,
        moneylineHome: -150,
        moneylineAway: 130,
      }

      const mockOdds = {
        id: 'odds-123',
        ...input,
        spread: null,
        total: null,
        updatedAt: new Date(),
      }

      vi.mocked(prisma.gameOdds.upsert).mockResolvedValue(mockOdds)

      await service.upsertOddsLine(input)

      expect(vi.mocked(prisma.gameOdds.upsert)).toHaveBeenCalledWith({
        where: {
          gameId_book_market: {
            gameId: 'game-123',
            book: 'draftkings',
            market: 'moneyline',
          },
        },
        update: {
          provider: 'natstat',
          updatedAt: expect.any(Date),
          moneylineHome: -150,
          moneylineAway: 130,
        },
        create: {
          gameId: 'game-123',
          provider: 'natstat',
          book: 'draftkings',
          market: 'moneyline',
          moneylineHome: -150,
          moneylineAway: 130,
          spread: null,
          total: null,
        },
      })
    })

    it('should upsert pointspread odds correctly', async () => {
      const input = {
        gameId: 'game-456',
        provider: 'natstat',
        book: 'fanduel',
        market: 'pointspread' as const,
        spread: -3.5,
      }

      vi.mocked(prisma.gameOdds.upsert).mockResolvedValue(createMockOdds())

      await service.upsertOddsLine(input)

      expect(vi.mocked(prisma.gameOdds.upsert)).toHaveBeenCalledWith({
        where: {
          gameId_book_market: {
            gameId: 'game-456',
            book: 'fanduel',
            market: 'pointspread',
          },
        },
        update: {
          provider: 'natstat',
          updatedAt: expect.any(Date),
          spread: -3.5,
        },
        create: {
          gameId: 'game-456',
          provider: 'natstat',
          book: 'fanduel',
          market: 'pointspread',
          moneylineHome: null,
          moneylineAway: null,
          spread: -3.5,
          total: null,
        },
      })
    })

    it('should upsert overunder odds correctly', async () => {
      const input = {
        gameId: 'game-789',
        provider: 'natstat',
        book: 'betmgm',
        market: 'overunder' as const,
        total: 45.5,
      }

      vi.mocked(prisma.gameOdds.upsert).mockResolvedValue(createMockOdds())

      await service.upsertOddsLine(input)

      expect(vi.mocked(prisma.gameOdds.upsert)).toHaveBeenCalledWith({
        where: {
          gameId_book_market: {
            gameId: 'game-789',
            book: 'betmgm',
            market: 'overunder',
          },
        },
        update: {
          provider: 'natstat',
          updatedAt: expect.any(Date),
          total: 45.5,
        },
        create: {
          gameId: 'game-789',
          provider: 'natstat',
          book: 'betmgm',
          market: 'overunder',
          moneylineHome: null,
          moneylineAway: null,
          spread: null,
          total: 45.5,
        },
      })
    })

    it('should use custom updatedAt when provided', async () => {
      const customDate = new Date('2025-10-23T12:00:00Z')
      const input = {
        gameId: 'game-123',
        provider: 'natstat',
        book: 'caesars',
        market: 'moneyline' as const,
        moneylineHome: -200,
        moneylineAway: 175,
        updatedAt: customDate,
      }

      vi.mocked(prisma.gameOdds.upsert).mockResolvedValue(createMockOdds())

      await service.upsertOddsLine(input)

      expect(vi.mocked(prisma.gameOdds.upsert)).toHaveBeenCalledWith({
        where: expect.any(Object),
        update: expect.objectContaining({
          updatedAt: customDate,
        }),
        create: expect.any(Object),
      })
    })

    it('should handle null values for optional fields', async () => {
      const input = {
        gameId: 'game-123',
        provider: 'natstat',
        book: 'draftkings',
        market: 'moneyline' as const,
        moneylineHome: null,
        moneylineAway: null,
      }

      vi.mocked(prisma.gameOdds.upsert).mockResolvedValue(createMockOdds())

      await service.upsertOddsLine(input)

      expect(vi.mocked(prisma.gameOdds.upsert)).toHaveBeenCalledWith({
        where: expect.any(Object),
        update: {
          provider: 'natstat',
          updatedAt: expect.any(Date),
          moneylineHome: null,
          moneylineAway: null,
        },
        create: {
          gameId: 'game-123',
          provider: 'natstat',
          book: 'draftkings',
          market: 'moneyline',
          moneylineHome: null,
          moneylineAway: null,
          spread: null,
          total: null,
        },
      })
    })

    it('should only update provided market-specific fields', async () => {
      const input = {
        gameId: 'game-123',
        provider: 'natstat',
        book: 'draftkings',
        market: 'moneyline' as const,
        moneylineHome: -150,
        // moneylineAway is undefined (not provided)
      }

      vi.mocked(prisma.gameOdds.upsert).mockResolvedValue(createMockOdds())

      await service.upsertOddsLine(input)

      const updateCall = vi.mocked(prisma.gameOdds.upsert).mock.calls[0][0].update
      expect(updateCall).toHaveProperty('moneylineHome', -150)
      expect(updateCall).not.toHaveProperty('moneylineAway')
      expect(updateCall).not.toHaveProperty('spread')
      expect(updateCall).not.toHaveProperty('total')
    })

    it('should handle zero values correctly', async () => {
      const input = {
        gameId: 'game-123',
        provider: 'natstat',
        book: 'draftkings',
        market: 'pointspread' as const,
        spread: 0,
      }

      vi.mocked(prisma.gameOdds.upsert).mockResolvedValue(createMockOdds())

      await service.upsertOddsLine(input)

      expect(vi.mocked(prisma.gameOdds.upsert)).toHaveBeenCalledWith({
        where: expect.any(Object),
        update: expect.objectContaining({
          spread: 0,
        }),
        create: expect.any(Object),
      })
    })

    it('should handle negative spread values', async () => {
      const input = {
        gameId: 'game-123',
        provider: 'natstat',
        book: 'draftkings',
        market: 'pointspread' as const,
        spread: -7.5,
      }

      vi.mocked(prisma.gameOdds.upsert).mockResolvedValue(createMockOdds())

      await service.upsertOddsLine(input)

      expect(vi.mocked(prisma.gameOdds.upsert)).toHaveBeenCalledWith({
        where: expect.any(Object),
        update: expect.objectContaining({
          spread: -7.5,
        }),
        create: expect.objectContaining({
          spread: -7.5,
        }),
      })
    })
  })

  describe('upsertOddsLines', () => {
    it('should batch upsert multiple odds lines', async () => {
      const lines = [
        {
          gameId: 'game-123',
          provider: 'natstat',
          book: 'draftkings',
          market: 'moneyline' as const,
          moneylineHome: -150,
          moneylineAway: 130,
        },
        {
          gameId: 'game-123',
          provider: 'natstat',
          book: 'draftkings',
          market: 'pointspread' as const,
          spread: -3.5,
        },
        {
          gameId: 'game-123',
          provider: 'natstat',
          book: 'draftkings',
          market: 'overunder' as const,
          total: 45.5,
        },
      ]

      vi.mocked(prisma.gameOdds.upsert).mockResolvedValue(createMockOdds())

      const count = await service.upsertOddsLines(lines)

      expect(count).toBe(3)
      expect(vi.mocked(prisma.gameOdds.upsert)).toHaveBeenCalledTimes(3)
    })

    it('should return zero for empty array', async () => {
      const count = await service.upsertOddsLines([])

      expect(count).toBe(0)
      expect(vi.mocked(prisma.gameOdds.upsert)).not.toHaveBeenCalled()
    })

    it('should handle single line in array', async () => {
      const lines = [
        {
          gameId: 'game-123',
          provider: 'natstat',
          book: 'draftkings',
          market: 'moneyline' as const,
          moneylineHome: -150,
          moneylineAway: 130,
        },
      ]

      vi.mocked(prisma.gameOdds.upsert).mockResolvedValue(createMockOdds())

      const count = await service.upsertOddsLines(lines)

      expect(count).toBe(1)
      expect(vi.mocked(prisma.gameOdds.upsert)).toHaveBeenCalledTimes(1)
    })

    it('should process all lines even if one fails', async () => {
      const lines = [
        {
          gameId: 'game-123',
          provider: 'natstat',
          book: 'draftkings',
          market: 'moneyline' as const,
          moneylineHome: -150,
          moneylineAway: 130,
        },
        {
          gameId: 'game-456',
          provider: 'natstat',
          book: 'fanduel',
          market: 'pointspread' as const,
          spread: -3.5,
        },
      ]

      vi.mocked(prisma.gameOdds.upsert)
        .mockResolvedValueOnce(createMockOdds())
        .mockRejectedValueOnce(new Error('Database error'))

      await expect(service.upsertOddsLines(lines)).rejects.toThrow('Database error')

      // First call succeeded, second failed
      expect(vi.mocked(prisma.gameOdds.upsert)).toHaveBeenCalledTimes(2)
    })

    it('should handle different books for the same game', async () => {
      const lines = [
        {
          gameId: 'game-123',
          provider: 'natstat',
          book: 'draftkings',
          market: 'moneyline' as const,
          moneylineHome: -150,
          moneylineAway: 130,
        },
        {
          gameId: 'game-123',
          provider: 'natstat',
          book: 'fanduel',
          market: 'moneyline' as const,
          moneylineHome: -145,
          moneylineAway: 125,
        },
        {
          gameId: 'game-123',
          provider: 'natstat',
          book: 'betmgm',
          market: 'moneyline' as const,
          moneylineHome: -155,
          moneylineAway: 135,
        },
      ]

      vi.mocked(prisma.gameOdds.upsert).mockResolvedValue(createMockOdds())

      const count = await service.upsertOddsLines(lines)

      expect(count).toBe(3)
      expect(vi.mocked(prisma.gameOdds.upsert)).toHaveBeenCalledTimes(3)

      // Verify each book got its own upsert
      const calls = vi.mocked(prisma.gameOdds.upsert).mock.calls
      expect(calls[0]![0]!.where.gameId_book_market?.book).toBe('draftkings')
      expect(calls[1]![0]!.where.gameId_book_market?.book).toBe('fanduel')
      expect(calls[2]![0]!.where.gameId_book_market?.book).toBe('betmgm')
    })
  })
})
