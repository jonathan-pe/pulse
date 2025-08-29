import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '@pulse/db'
import { getAuth } from '@clerk/express'

export const predictionsRouter: import('express').Router = Router()

const createInput = z.object({
  gameId: z.string(),
  type: z.enum(['MONEYLINE', 'SPREAD', 'TOTAL']),
  pick: z.string(),
  stakePoints: z.number().optional(),
})

predictionsRouter.post('/create', async (req: Request, res: Response) => {
  const auth = getAuth(req)
  if (!auth.userId) return res.status(401).json({ error: 'unauthorized' })

  const parsed = createInput.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'invalid input', details: parsed.error.format() })

  const input = parsed.data
  const created = await prisma.prediction.create({
    data: {
      userId: auth.userId ?? '',
      gameId: input.gameId,
      type: input.type,
      pick: input.pick,
      stakePoints: input.stakePoints ?? 1,
    },
  })

  return res.json(created)
})

predictionsRouter.get('/my-pending', async (req: Request, res: Response) => {
  const auth = getAuth(req)
  if (!auth.userId) return res.status(401).json({ error: 'unauthorized' })

  const preds = await prisma.prediction.findMany({
    where: { userId: auth.userId ?? '', lockedAt: null },
    orderBy: { createdAt: 'desc' },
  })
  return res.json(preds)
})

predictionsRouter.get('/my-history', async (req: Request, res: Response) => {
  const auth = getAuth(req)
  if (!auth.userId) return res.status(401).json({ error: 'unauthorized' })

  const preds = await prisma.prediction.findMany({
    where: { userId: auth.userId ?? '' },
    orderBy: { createdAt: 'desc' },
  })
  return res.json(preds)
})
