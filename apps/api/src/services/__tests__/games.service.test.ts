import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GamesService } from '../games.service'

// Mock the @pulse/db module
vi.mock('@pulse/db', () => ({
  prisma: {
    game: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    result: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}))

// Import the mocked prisma after mocking
import { prisma } from '@pulse/db'

describe('GamesService', () => {
  let service: GamesService

  beforeEach(() => {
    service = new GamesService()
    vi.clearAllMocks()
  })

  describe('findGame', () => {
    it('should find an existing game by unique fields', async () => {
      const mockGame = {
        id: 'game-123',
        league: 'NFL',
        startsAt: new Date('2025-10-23T13:00:00Z'),
        homeTeam: 'Kansas City Chiefs',
        awayTeam: 'San Francisco 49ers',
        status: 'scheduled',
      }

      vi.mocked(prisma.game.findFirst).mockResolvedValue(mockGame)

      const result = await service.findGame({
        league: 'NFL',
        startsAt: new Date('2025-10-23T13:00:00Z'),
        homeTeam: 'Kansas City Chiefs',
        awayTeam: 'San Francisco 49ers',
      })

      expect(result).toEqual(mockGame)
      expect(prisma.game.findFirst).toHaveBeenCalledWith({
        where: {
          league: 'NFL',
          startsAt: new Date('2025-10-23T13:00:00Z'),
          homeTeam: 'Kansas City Chiefs',
          awayTeam: 'San Francisco 49ers',
        },
      })
    })

    it('should return null when game is not found', async () => {
      vi.mocked(prisma.game.findFirst).mockResolvedValue(null)

      const result = await service.findGame({
        league: 'NFL',
        startsAt: new Date('2025-10-23T13:00:00Z'),
        homeTeam: 'Kansas City Chiefs',
        awayTeam: 'San Francisco 49ers',
      })

      expect(result).toBeNull()
    })
  })

  describe('findOrCreateGame', () => {
    it('should return existing game if found', async () => {
      const mockGame = {
        id: 'game-123',
        league: 'NFL',
        startsAt: new Date('2025-10-23T13:00:00Z'),
        homeTeam: 'Kansas City Chiefs',
        awayTeam: 'San Francisco 49ers',
        status: 'scheduled',
      }

      vi.mocked(prisma.game.findFirst).mockResolvedValue(mockGame)

      const result = await service.findOrCreateGame({
        league: 'NFL',
        startsAt: new Date('2025-10-23T13:00:00Z'),
        homeTeam: 'Kansas City Chiefs',
        awayTeam: 'San Francisco 49ers',
      })

      expect(result).toEqual(mockGame)
      expect(prisma.game.create).not.toHaveBeenCalled()
    })

    it('should create new game if not found', async () => {
      const newGame = {
        id: 'game-456',
        league: 'NBA',
        startsAt: new Date('2025-10-24T19:00:00Z'),
        homeTeam: 'Los Angeles Lakers',
        awayTeam: 'Boston Celtics',
        status: 'scheduled',
      }

      vi.mocked(prisma.game.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.game.create).mockResolvedValue(newGame)

      const result = await service.findOrCreateGame({
        league: 'NBA',
        startsAt: new Date('2025-10-24T19:00:00Z'),
        homeTeam: 'Los Angeles Lakers',
        awayTeam: 'Boston Celtics',
      })

      expect(result).toEqual(newGame)
      expect(prisma.game.create).toHaveBeenCalledWith({
        data: {
          league: 'NBA',
          startsAt: new Date('2025-10-24T19:00:00Z'),
          homeTeam: 'Los Angeles Lakers',
          awayTeam: 'Boston Celtics',
          status: 'scheduled',
        },
      })
    })

    it('should use custom status when provided', async () => {
      const newGame = {
        id: 'game-789',
        league: 'NHL',
        startsAt: new Date('2025-10-25T20:00:00Z'),
        homeTeam: 'Toronto Maple Leafs',
        awayTeam: 'Montreal Canadiens',
        status: 'final',
      }

      vi.mocked(prisma.game.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.game.create).mockResolvedValue(newGame)

      await service.findOrCreateGame({
        league: 'NHL',
        startsAt: new Date('2025-10-25T20:00:00Z'),
        homeTeam: 'Toronto Maple Leafs',
        awayTeam: 'Montreal Canadiens',
        status: 'final',
      })

      expect(prisma.game.create).toHaveBeenCalledWith({
        data: {
          league: 'NHL',
          startsAt: new Date('2025-10-25T20:00:00Z'),
          homeTeam: 'Toronto Maple Leafs',
          awayTeam: 'Montreal Canadiens',
          status: 'final',
        },
      })
    })
  })

  describe('updateGameMetadata', () => {
    it('should update status when it has changed', async () => {
      const gameId = 'game-123'
      const currentGame = {
        status: 'scheduled',
        startsAt: new Date('2025-10-23T13:00:00Z'),
      }

      vi.mocked(prisma.game.update).mockResolvedValue({
        id: gameId,
        league: 'NFL',
        homeTeam: 'Kansas City Chiefs',
        awayTeam: 'San Francisco 49ers',
        ...currentGame,
        status: 'in_progress',
      })

      const result = await service.updateGameMetadata(gameId, currentGame, {
        status: 'in_progress',
      })

      expect(result).toBe(true)
      expect(prisma.game.update).toHaveBeenCalledWith({
        where: { id: gameId },
        data: { status: 'in_progress' },
      })
    })

    it('should update startsAt when it has changed', async () => {
      const gameId = 'game-123'
      const currentGame = {
        status: 'scheduled',
        startsAt: new Date('2025-10-23T13:00:00Z'),
      }
      const newStartsAt = new Date('2025-10-23T14:00:00Z')

      vi.mocked(prisma.game.update).mockResolvedValue({
        id: gameId,
        league: 'NFL',
        homeTeam: 'Kansas City Chiefs',
        awayTeam: 'San Francisco 49ers',
        ...currentGame,
        startsAt: newStartsAt,
      })

      const result = await service.updateGameMetadata(gameId, currentGame, {
        startsAt: newStartsAt,
      })

      expect(result).toBe(true)
      expect(prisma.game.update).toHaveBeenCalledWith({
        where: { id: gameId },
        data: { startsAt: newStartsAt },
      })
    })

    it('should update both status and startsAt when both changed', async () => {
      const gameId = 'game-123'
      const currentGame = {
        status: 'scheduled',
        startsAt: new Date('2025-10-23T13:00:00Z'),
      }
      const newStartsAt = new Date('2025-10-23T14:00:00Z')

      vi.mocked(prisma.game.update).mockResolvedValue({
        id: gameId,
        league: 'NFL',
        homeTeam: 'Kansas City Chiefs',
        awayTeam: 'San Francisco 49ers',
        status: 'in_progress',
        startsAt: newStartsAt,
      })

      const result = await service.updateGameMetadata(gameId, currentGame, {
        status: 'in_progress',
        startsAt: newStartsAt,
      })

      expect(result).toBe(true)
      expect(prisma.game.update).toHaveBeenCalledWith({
        where: { id: gameId },
        data: {
          status: 'in_progress',
          startsAt: newStartsAt,
        },
      })
    })

    it('should not update when nothing has changed', async () => {
      const gameId = 'game-123'
      const currentGame = {
        status: 'scheduled',
        startsAt: new Date('2025-10-23T13:00:00Z'),
      }

      const result = await service.updateGameMetadata(gameId, currentGame, {
        status: 'scheduled',
        startsAt: new Date('2025-10-23T13:00:00Z'),
      })

      expect(result).toBe(false)
      expect(prisma.game.update).not.toHaveBeenCalled()
    })

    it('should return false when no updates provided', async () => {
      const gameId = 'game-123'
      const currentGame = {
        status: 'scheduled',
        startsAt: new Date('2025-10-23T13:00:00Z'),
      }

      const result = await service.updateGameMetadata(gameId, currentGame, {})

      expect(result).toBe(false)
      expect(prisma.game.update).not.toHaveBeenCalled()
    })
  })

  describe('upsertGameScores', () => {
    it('should create new result when none exists', async () => {
      const gameId = 'game-123'
      const scores = { homeScore: 28, awayScore: 21 }

      vi.mocked(prisma.result.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.result.create).mockResolvedValue({
        id: 'result-123',
        gameId,
        ...scores,
        settledAt: new Date(),
      })

      const result = await service.upsertGameScores(gameId, scores)

      expect(result).toBe(true)
      expect(prisma.result.create).toHaveBeenCalledWith({
        data: {
          gameId,
          homeScore: 28,
          awayScore: 21,
        },
      })
    })

    it('should update existing result when scores have changed', async () => {
      const gameId = 'game-123'
      const existingResult = {
        id: 'result-123',
        gameId,
        homeScore: 21,
        awayScore: 14,
        settledAt: new Date(),
      }
      const newScores = { homeScore: 28, awayScore: 21 }

      vi.mocked(prisma.result.findUnique).mockResolvedValue(existingResult)
      vi.mocked(prisma.result.update).mockResolvedValue({
        ...existingResult,
        ...newScores,
      })

      const result = await service.upsertGameScores(gameId, newScores)

      expect(result).toBe(true)
      expect(prisma.result.update).toHaveBeenCalledWith({
        where: { gameId },
        data: {
          homeScore: 28,
          awayScore: 21,
        },
      })
    })

    it('should not update when scores are the same', async () => {
      const gameId = 'game-123'
      const scores = { homeScore: 28, awayScore: 21 }
      const existingResult = {
        id: 'result-123',
        gameId,
        ...scores,
        settledAt: new Date(),
      }

      vi.mocked(prisma.result.findUnique).mockResolvedValue(existingResult)

      const result = await service.upsertGameScores(gameId, scores)

      expect(result).toBe(false)
      expect(prisma.result.update).not.toHaveBeenCalled()
    })

    it('should handle zero scores correctly', async () => {
      const gameId = 'game-123'
      const scores = { homeScore: 0, awayScore: 0 }

      vi.mocked(prisma.result.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.result.create).mockResolvedValue({
        id: 'result-123',
        gameId,
        ...scores,
        settledAt: new Date(),
      })

      const result = await service.upsertGameScores(gameId, scores)

      expect(result).toBe(true)
      expect(prisma.result.create).toHaveBeenCalledWith({
        data: {
          gameId,
          homeScore: 0,
          awayScore: 0,
        },
      })
    })
  })
})
