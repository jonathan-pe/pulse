/**
 * Integration tests for Points Router
 *
 * These tests verify the full HTTP request/response cycle including:
 * - Route matching and HTTP methods
 * - Request parsing (query params, body)
 * - Authentication middleware
 * - Input validation (Zod schemas)
 * - Response formatting and status codes
 * - Error handling
 *
 * Complements service layer tests which test business logic in isolation.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express, { type Express } from 'express'
import { pointsRouter } from '../points'

// Mock dependencies
vi.mock('@clerk/express', () => ({
  getAuth: vi.fn(),
}))

vi.mock('@pulse/db', () => ({
  prisma: {
    pointsLedger: {
      aggregate: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    prediction: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    $queryRaw: vi.fn(),
    $queryRawUnsafe: vi.fn(),
  },
}))

import { getAuth } from '@clerk/express'
import { prisma } from '@/lib/db'

describe('Points Router Integration Tests', () => {
  let app: Express

  beforeEach(() => {
    // Setup Express app with router
    app = express()
    app.use(express.json())
    app.use('/api/points', pointsRouter)
    vi.clearAllMocks()
  })

  describe('GET /api/points/me', () => {
    it('should return user points when authenticated', async () => {
      vi.mocked(getAuth).mockReturnValue({ userId: 'user-123' } as any)
      vi.mocked(prisma.pointsLedger.aggregate).mockResolvedValue({
        _sum: { delta: 1250 },
      } as any)

      const response = await request(app).get('/api/points/me')

      expect(response.status).toBe(200)
      expect(response.body).toEqual({ points: 1250 })
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(getAuth).mockReturnValue({ userId: null } as any)

      const response = await request(app).get('/api/points/me')

      expect(response.status).toBe(401)
      expect(response.body).toEqual({ error: 'Unauthorized' })
      expect(prisma.pointsLedger.aggregate).not.toHaveBeenCalled()
    })

    it('should return 0 points for new users', async () => {
      vi.mocked(getAuth).mockReturnValue({ userId: 'user-123' } as any)
      vi.mocked(prisma.pointsLedger.aggregate).mockResolvedValue({
        _sum: { delta: null },
      } as any)

      const response = await request(app).get('/api/points/me')

      expect(response.status).toBe(200)
      expect(response.body).toEqual({ points: 0 })
    })
  })

  describe('GET /api/points/leaderboard', () => {
    it('should return all-time leaderboard by default', async () => {
      const mockLeaderboard = [
        { userId: 'user-1', points: BigInt(1500) },
        { userId: 'user-2', points: BigInt(1200) },
      ]

      const mockUsers = [
        { id: 'user-1', username: 'john', imageUrl: 'http://img1.com' },
        { id: 'user-2', username: 'jane', imageUrl: 'http://img2.com' },
      ]

      vi.mocked(prisma.$queryRawUnsafe).mockResolvedValueOnce(mockLeaderboard)
      vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers as any)

      const response = await request(app).get('/api/points/leaderboard')

      expect(response.status).toBe(200)
      expect(response.body).toHaveLength(2)
      expect(response.body[0]).toMatchObject({
        rank: 1,
        userId: 'user-1',
        username: 'john',
        points: 1500,
        rankChange: null,
      })
    })

    it('should support daily period filtering', async () => {
      vi.mocked(prisma.$queryRawUnsafe)
        .mockResolvedValueOnce([{ userId: 'user-1', points: BigInt(100) }]) // current
        .mockResolvedValueOnce([{ userId: 'user-1', points: BigInt(80) }]) // previous

      vi.mocked(prisma.user.findMany).mockResolvedValue([{ id: 'user-1', username: 'john', imageUrl: null }] as any)

      const response = await request(app).get('/api/points/leaderboard?period=daily')

      expect(response.status).toBe(200)
      expect(response.body).toHaveLength(1)
      expect(response.body[0]).toMatchObject({
        rank: 1,
        userId: 'user-1',
        username: 'john',
        points: 100,
      })
    })

    it('should support weekly period filtering', async () => {
      vi.mocked(prisma.$queryRawUnsafe)
        .mockResolvedValueOnce([{ userId: 'user-1', points: BigInt(250) }]) // current
        .mockResolvedValueOnce([]) // previous (no data)

      vi.mocked(prisma.user.findMany).mockResolvedValue([{ id: 'user-1', username: 'john', imageUrl: null }] as any)

      const response = await request(app).get('/api/points/leaderboard?period=weekly')

      expect(response.status).toBe(200)
      expect(response.body).toHaveLength(1)
      expect(response.body[0].points).toBe(250)
    })

    it('should support custom limits via query param', async () => {
      vi.mocked(prisma.$queryRawUnsafe).mockResolvedValue([])
      vi.mocked(prisma.user.findMany).mockResolvedValue([])

      const response = await request(app).get('/api/points/leaderboard?limit=10')

      expect(response.status).toBe(200)
      expect(response.body).toEqual([])
      const sqlQuery = vi.mocked(prisma.$queryRawUnsafe).mock.calls[0][0] as string
      expect(sqlQuery).toContain('LIMIT 10')
    })

    it('should calculate rank changes between periods', async () => {
      vi.mocked(prisma.$queryRawUnsafe)
        .mockResolvedValueOnce([
          { userId: 'user-1', points: BigInt(150) },
          { userId: 'user-2', points: BigInt(100) },
        ]) // Current period
        .mockResolvedValueOnce([
          { userId: 'user-2', points: BigInt(90) },
          { userId: 'user-1', points: BigInt(80) },
        ]) // Previous period (user-2 was rank 1, user-1 was rank 2)

      vi.mocked(prisma.user.findMany).mockResolvedValue([
        { id: 'user-1', username: 'john', imageUrl: null },
        { id: 'user-2', username: 'jane', imageUrl: null },
      ] as any)

      const response = await request(app).get('/api/points/leaderboard?period=daily')

      expect(response.status).toBe(200)
      expect(response.body[0]).toMatchObject({
        rank: 1,
        userId: 'user-1',
        rankChange: 1, // Moved up from rank 2 to rank 1
      })
      expect(response.body[1]).toMatchObject({
        rank: 2,
        userId: 'user-2',
        rankChange: -1, // Moved down from rank 1 to rank 2
      })
    })

    it('should return 400 for invalid period', async () => {
      const response = await request(app).get('/api/points/leaderboard?period=invalid')

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('GET /api/points/history', () => {
    it('should return points history for authenticated user', async () => {
      vi.mocked(getAuth).mockReturnValue({ userId: 'user-123' } as any)

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

      const response = await request(app).get('/api/points/history')

      expect(response.status).toBe(200)
      expect(response.body).toHaveLength(2)
      expect(response.body[0]).toMatchObject({
        id: 'ledger-1',
        delta: 25,
        reason: 'Correct prediction',
      })
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(getAuth).mockReturnValue({ userId: null } as any)

      const response = await request(app).get('/api/points/history')

      expect(response.status).toBe(401)
      expect(response.body).toEqual({ error: 'Unauthorized' })
      expect(prisma.pointsLedger.findMany).not.toHaveBeenCalled()
    })

    it('should support pagination with limit query param', async () => {
      vi.mocked(getAuth).mockReturnValue({ userId: 'user-123' } as any)
      vi.mocked(prisma.pointsLedger.findMany).mockResolvedValue([])

      const response = await request(app).get('/api/points/history?limit=50')

      expect(response.status).toBe(200)
      expect(prisma.pointsLedger.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
          skip: 0,
        })
      )
    })

    it('should support pagination with offset query param', async () => {
      vi.mocked(getAuth).mockReturnValue({ userId: 'user-123' } as any)
      vi.mocked(prisma.pointsLedger.findMany).mockResolvedValue([])

      const response = await request(app).get('/api/points/history?limit=25&offset=50')

      expect(response.status).toBe(200)
      expect(prisma.pointsLedger.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 25,
          skip: 50,
        })
      )
    })

    it('should enforce maximum limit of 200', async () => {
      vi.mocked(getAuth).mockReturnValue({ userId: 'user-123' } as any)

      const response = await request(app).get('/api/points/history?limit=300')

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })

    it('should reject negative offset', async () => {
      vi.mocked(getAuth).mockReturnValue({ userId: 'user-123' } as any)

      const response = await request(app).get('/api/points/history?offset=-10')

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('GET /api/points/stats', () => {
    it('should return comprehensive user stats when authenticated', async () => {
      vi.mocked(getAuth).mockReturnValue({ userId: 'user-123' } as any)

      // Mock all the Prisma calls that getUserStats makes
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-123',
        currentStreak: 5,
      } as any)

      vi.mocked(prisma.pointsLedger.aggregate).mockResolvedValue({
        _sum: { delta: 1250 },
      } as any)

      vi.mocked(prisma.prediction.findMany).mockResolvedValue([
        { isCorrect: true, game: { league: 'NBA' } },
        { isCorrect: true, game: { league: 'NBA' } },
        { isCorrect: false, game: { league: 'NBA' } },
      ] as any)

      vi.mocked(prisma.pointsLedger.findMany).mockResolvedValue([
        { delta: 45, createdAt: new Date(), reason: 'test' },
      ] as any)

      vi.mocked(prisma.pointsLedger.groupBy).mockResolvedValue([])

      vi.mocked(prisma.prediction.count)
        .mockResolvedValueOnce(3) // predictionsToday
        .mockResolvedValueOnce(3) // bonusTierUsed

      vi.mocked(prisma.$queryRaw).mockResolvedValue([{ count: BigInt(23) }] as any)

      const response = await request(app).get('/api/points/stats')

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        totalPoints: 1250,
        currentStreak: 5,
        totalPredictions: 3,
        correctPredictions: 2,
        predictionsToday: 3,
        bonusTierUsed: 3,
        leaderboardRank: 24,
      })
      expect(response.body.byLeague).toBeDefined()
      expect(response.body.pointsOverTime).toBeDefined()
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(getAuth).mockReturnValue({ userId: null } as any)

      const response = await request(app).get('/api/points/stats')

      expect(response.status).toBe(401)
      expect(response.body).toEqual({ error: 'Unauthorized' })
    })

    it('should handle users with no stats gracefully', async () => {
      vi.mocked(getAuth).mockReturnValue({ userId: 'new-user' } as any)

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'new-user',
        currentStreak: 0,
      } as any)

      vi.mocked(prisma.pointsLedger.aggregate).mockResolvedValue({
        _sum: { delta: null },
      } as any)

      vi.mocked(prisma.prediction.findMany).mockResolvedValue([])
      vi.mocked(prisma.pointsLedger.findMany).mockResolvedValue([])
      vi.mocked(prisma.pointsLedger.groupBy).mockResolvedValue([])
      vi.mocked(prisma.prediction.count).mockResolvedValue(0)
      vi.mocked(prisma.$queryRaw).mockResolvedValue([{ count: BigInt(0) }] as any)

      const response = await request(app).get('/api/points/stats')

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        totalPoints: 0,
        currentStreak: 0,
        totalPredictions: 0,
        correctPredictions: 0,
        overallWinRate: 0,
        byLeague: [],
        pointsOverTime: [],
      })
    })
  })
})
