import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '@pulse/db'
import { getAuth } from '@clerk/express'

export const pointsRouter: import('express').Router = Router()

pointsRouter.get('/my-points', async (req: Request, res: Response) => {
  const auth = getAuth(req)
  if (!auth.userId) return res.status(401).json({ error: 'unauthorized' })

  const sum = await prisma.pointsLedger.aggregate({ where: { userId: auth.userId ?? '' }, _sum: { delta: true } })
  return res.json({ points: sum._sum.delta ?? 0 })
})

pointsRouter.get('/leaderboard', async (req: Request, res: Response) => {
  const parsed = z
    .object({ limit: z.number().optional() })
    .safeParse({ limit: req.query.limit ? Number(req.query.limit) : undefined })
  if (!parsed.success) return res.status(400).json({ error: 'invalid input', details: parsed.error.format() })
  const limit = parsed.data.limit ?? 10

  const rows = await prisma.$queryRaw`
      SELECT "userId", SUM("delta") as points
      FROM "PointsLedger"
      GROUP BY "userId"
      ORDER BY points DESC
      LIMIT ${limit}
    `

  return res.json(rows)
})
