import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { type Prisma, prisma } from '@pulse/db'

export const gamesRouter: import('express').Router = Router()

const listInput = z.object({ league: z.string().optional(), limit: z.number().optional() })

gamesRouter.get('/list-upcoming', async (req: Request, res: Response) => {
  const parsed = listInput.safeParse({
    league: req.query.league,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  })
  if (!parsed.success) return res.status(400).json({ error: 'invalid input', details: parsed.error.format() })

  const input = parsed.data
  const where: Prisma.GameWhereInput = { status: 'scheduled' }
  if (input.league) where.league = input.league

  const games = await prisma.game.findMany({
    where,
    orderBy: { startsAt: 'asc' },
    take: input.limit ?? 50,
    include: { odds: true },
  })

  return res.json(games)
})

gamesRouter.get('/by-id/:id', async (req: Request, res: Response) => {
  const id = req.params.id
  if (!id) return res.status(400).json({ error: 'missing id' })

  const game = await prisma.game.findUnique({ where: { id }, include: { odds: true, result: true } })
  return res.json(game)
})
