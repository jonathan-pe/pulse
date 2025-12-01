import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GamesService } from '../games.service'

// Mock the @/lib/db module
vi.mock('@/lib/db', () => ({
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
import { prisma } from '@/lib/db'

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
        homeTeamId: 'team-kc',
        awayTeamId: 'team-sf',
        status: 'scheduled',
      }

      vi.mocked(prisma.game.findFirst).mockResolvedValue(mockGame)

      const result = await service.findGame({
        league: 'NFL',
        startsAt: new Date('2025-10-23T13:00:00Z'),
        homeTeamId: 'team-kc',
        awayTeamId: 'team-sf',
      })

      expect(result).toEqual(mockGame)
      expect(prisma.game.findFirst).toHaveBeenCalledWith({
        where: {
          league: 'NFL',
          startsAt: new Date('2025-10-23T13:00:00Z'),
          homeTeamId: 'team-kc',
          awayTeamId: 'team-sf',
        },
      })
    })

    it('should return null when game is not found', async () => {
      vi.mocked(prisma.game.findFirst).mockResolvedValue(null)

      const result = await service.findGame({
        league: 'NFL',
        startsAt: new Date('2025-10-23T13:00:00Z'),
        homeTeamId: 'team-kc',
        awayTeamId: 'team-sf',
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
        homeTeamId: 'team-kc',
        awayTeamId: 'team-sf',
        status: 'scheduled',
      }

      vi.mocked(prisma.game.findFirst).mockResolvedValue(mockGame)

      const result = await service.findOrCreateGame({
        league: 'NFL',
        startsAt: new Date('2025-10-23T13:00:00Z'),
        homeTeamId: 'team-kc',
        awayTeamId: 'team-sf',
      })

      expect(result).toEqual(mockGame)
      expect(prisma.game.create).not.toHaveBeenCalled()
    })

    it('should create new game if not found', async () => {
      const newGame = {
        id: 'game-456',
        league: 'NBA',
        startsAt: new Date('2025-10-24T19:00:00Z'),
        homeTeamId: 'team-lal',
        awayTeamId: 'team-bos',
        status: 'scheduled',
        homeTeam: {
          id: 'team-lal',
          name: 'Los Angeles Lakers',
          code: 'LAL',
          league: 'NBA',
        },
        awayTeam: {
          id: 'team-bos',
          name: 'Boston Celtics',
          code: 'BOS',
          league: 'NBA',
        },
      }

      vi.mocked(prisma.game.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.game.create).mockResolvedValue(newGame)

      const result = await service.findOrCreateGame({
        league: 'NBA',
        startsAt: new Date('2025-10-24T19:00:00Z'),
        homeTeamId: 'team-lal',
        awayTeamId: 'team-bos',
      })

      expect(result).toEqual(newGame)
      expect(prisma.game.create).toHaveBeenCalledWith({
        data: {
          league: 'NBA',
          startsAt: new Date('2025-10-24T19:00:00Z'),
          homeTeamId: 'team-lal',
          awayTeamId: 'team-bos',
          status: 'scheduled',
        },
        include: {
          homeTeam: true,
          awayTeam: true,
        },
      })
    })

    it('should use custom status when provided', async () => {
      const newGame = {
        id: 'game-789',
        league: 'NHL',
        startsAt: new Date('2025-10-25T20:00:00Z'),
        homeTeamId: 'team-tor',
        awayTeamId: 'team-mtl',
        status: 'final',
        homeTeam: {
          id: 'team-tor',
          name: 'Toronto Maple Leafs',
          code: 'TOR',
          league: 'NHL',
        },
        awayTeam: {
          id: 'team-mtl',
          name: 'Montreal Canadiens',
          code: 'MTL',
          league: 'NHL',
        },
      }

      vi.mocked(prisma.game.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.game.create).mockResolvedValue(newGame)

      await service.findOrCreateGame({
        league: 'NHL',
        startsAt: new Date('2025-10-25T20:00:00Z'),
        homeTeamId: 'team-tor',
        awayTeamId: 'team-mtl',
        status: 'final',
      })

      expect(prisma.game.create).toHaveBeenCalledWith({
        data: {
          league: 'NHL',
          startsAt: new Date('2025-10-25T20:00:00Z'),
          homeTeamId: 'team-tor',
          awayTeamId: 'team-mtl',
          status: 'final',
        },
        include: {
          homeTeam: true,
          awayTeam: true,
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
        homeTeamId: 'team-kc',
        awayTeamId: 'team-sf',
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
        homeTeamId: 'team-kc',
        awayTeamId: 'team-sf',
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
        homeTeamId: 'team-kc',
        awayTeamId: 'team-sf',
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
        scoredAt: null,
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
        scoredAt: null,
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
        scoredAt: null,
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
        scoredAt: null,
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
