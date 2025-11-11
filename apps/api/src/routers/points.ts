import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { getAuth } from '@clerk/express'
import { prisma } from '@pulse/db'

const leaderboardSchema = z.object({
  limit: z.coerce.number().optional(),
})

export const pointsRouter = Router()

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

// GET /api/points/leaderboard - Get leaderboard
pointsRouter.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const input = leaderboardSchema.parse(req.query)
    const limit = input.limit ?? 10

    // Simple leaderboard: sum points per user, order desc
    const rows = await prisma.$queryRaw`
      SELECT "userId", SUM("delta") as points
      FROM "PointsLedger"
      GROUP BY "userId"
      ORDER BY points DESC
      LIMIT ${limit}
    `

    res.json(rows)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.issues })
      return
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})
