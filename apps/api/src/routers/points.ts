import { Router, type Request, type Response } from 'express'
import type { Router as ExpressRouter } from 'express'
import { z } from 'zod'
import { getAuth } from '@clerk/express'
import { prisma } from '@/lib/db'
import { pointsService } from '../services/points.service'
import { DAILY_RESET_HOUR_UTC } from '@pulse/shared'

const leaderboardSchema = z.object({
  limit: z.coerce.number().optional(),
  period: z.enum(['daily', 'weekly', 'alltime']).optional().default('alltime'),
})

const historySchema = z.object({
  limit: z.coerce.number().min(1).max(200).optional().default(100),
  offset: z.coerce.number().min(0).optional().default(0),
})

export const pointsRouter: ExpressRouter = Router()

// GET /api/points/me - Get current user's points
pointsRouter.get('/me', async (req: Request, res: Response) => {
  try {
    const auth = getAuth(req)
    const userId = auth.userId

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const sum = await prisma.pointsLedger.aggregate({
      where: { userId },
      _sum: { delta: true },
    })

    res.json({ points: sum._sum.delta ?? 0 })
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/points/leaderboard - Get leaderboard with optional time filtering
pointsRouter.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const input = leaderboardSchema.parse(req.query)
    const limit = input.limit ?? 50
    const period = input.period ?? 'alltime'

    // Calculate date filter based on period
    let dateFilter = ''
    if (period === 'daily') {
      const now = new Date()
      const resetToday = new Date(now)
      resetToday.setUTCHours(DAILY_RESET_HOUR_UTC, 0, 0, 0)

      // If current time is before today's reset, use yesterday's reset
      if (now < resetToday) {
        resetToday.setDate(resetToday.getDate() - 1)
      }

      dateFilter = `WHERE "createdAt" >= '${resetToday.toISOString()}'`
    } else if (period === 'weekly') {
      const now = new Date()
      const weekStart = new Date(now)
      weekStart.setUTCHours(DAILY_RESET_HOUR_UTC, 0, 0, 0)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()) // Start of week (Sunday at RESET_HOUR)

      // If current time is before this week's Sunday reset, use last week's Sunday reset
      if (now < weekStart) {
        weekStart.setDate(weekStart.getDate() - 7)
      }

      dateFilter = `WHERE "createdAt" >= '${weekStart.toISOString()}'`
    }

    // Get current period leaderboard
    const currentRows = await prisma.$queryRawUnsafe<Array<{ userId: string; points: bigint }>>(`
      SELECT "userId", SUM("delta") as points
      FROM "PointsLedger"
      ${dateFilter}
      GROUP BY "userId"
      ORDER BY points DESC
      LIMIT ${limit}
    `)

    // Get previous period for rank changes (if not alltime)
    let previousRanks: Map<string, number> = new Map()
    if (period !== 'alltime') {
      let previousDateFilter = ''
      if (period === 'daily') {
        const now = new Date()
        const resetToday = new Date(now)
        resetToday.setUTCHours(DAILY_RESET_HOUR_UTC, 0, 0, 0)

        // If current time is before today's reset, use yesterday's reset
        if (now < resetToday) {
          resetToday.setDate(resetToday.getDate() - 1)
        }

        const resetYesterday = new Date(resetToday)
        resetYesterday.setDate(resetYesterday.getDate() - 1)

        previousDateFilter = `WHERE "createdAt" >= '${resetYesterday.toISOString()}' AND "createdAt" < '${resetToday.toISOString()}'`
      } else if (period === 'weekly') {
        const now = new Date()
        const thisWeekStart = new Date(now)
        thisWeekStart.setUTCHours(DAILY_RESET_HOUR_UTC, 0, 0, 0)
        thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay())

        // If current time is before this week's Sunday reset, use last week's Sunday reset
        if (now < thisWeekStart) {
          thisWeekStart.setDate(thisWeekStart.getDate() - 7)
        }

        const lastWeekStart = new Date(thisWeekStart)
        lastWeekStart.setDate(lastWeekStart.getDate() - 7)
        previousDateFilter = `WHERE "createdAt" >= '${lastWeekStart.toISOString()}' AND "createdAt" < '${thisWeekStart.toISOString()}'`
      }

      if (previousDateFilter) {
        const previousRows = await prisma.$queryRawUnsafe<Array<{ userId: string; points: bigint }>>(`
          SELECT "userId", SUM("delta") as points
          FROM "PointsLedger"
          ${previousDateFilter}
          GROUP BY "userId"
          ORDER BY points DESC
        `)

        previousRows.forEach((row, index) => {
          previousRanks.set(row.userId, index + 1)
        })
      }
    }

    // Fetch user details and calculate rank changes
    const userIds = currentRows.map((row) => row.userId)
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true, imageUrl: true },
    })

    const userMap = new Map(users.map((u) => [u.id, u]))

    const leaderboard = currentRows.map((row, index) => {
      const user = userMap.get(row.userId)
      const currentRank = index + 1
      const previousRank = previousRanks.get(row.userId)
      const rankChange = previousRank ? previousRank - currentRank : null

      return {
        rank: currentRank,
        userId: row.userId,
        username: user?.username ?? null,
        imageUrl: user?.imageUrl ?? null,
        points: Number(row.points),
        rankChange,
      }
    })

    res.json(leaderboard)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.issues })
      return
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/points/history - Get user's points transaction history
pointsRouter.get('/history', async (req: Request, res: Response) => {
  try {
    const auth = getAuth(req)
    const userId = auth.userId

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const input = historySchema.parse(req.query)
    const history = await pointsService.getPointsHistory(userId, input.limit, input.offset)

    res.json(history)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.issues })
      return
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/points/stats - Get comprehensive user statistics
pointsRouter.get('/stats', async (req: Request, res: Response) => {
  try {
    const auth = getAuth(req)
    const userId = auth.userId

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const stats = await pointsService.getUserStats(userId)
    res.json(stats)
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
})
