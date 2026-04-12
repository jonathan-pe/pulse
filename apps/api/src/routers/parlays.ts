import { Router, type Request, type Response } from 'express'
import type { Router as ExpressRouter } from 'express'
import { z } from 'zod'
import { getAuth } from '@clerk/express'
import { PREDICTION_TYPES } from '@pulse/types'
import { parlaysService } from '../services/parlays.service'
import { usersService } from '../services/users.service'
import { PredictionRejectedError } from '../lib/api-errors'

const ParlayLegSchema = z.object({
  gameId: z.string(),
  type: z.enum(PREDICTION_TYPES),
  pick: z.string(),
})

const CreateParlayBodySchema = z.object({
  ticketType: z.enum(['MULTI_GAME', 'SAME_GAME']),
  legs: z.array(ParlayLegSchema).min(2).max(20),
})

export const parlaysRouter: ExpressRouter = Router()

function handleParlayError(res: Response, error: unknown): boolean {
  if (error instanceof PredictionRejectedError) {
    res.status(error.httpStatus).json({ error: error.message, code: error.code })
    return true
  }
  return false
}

// POST /api/parlays/quote
parlaysRouter.post('/quote', async (req: Request, res: Response) => {
  try {
    const auth = getAuth(req)
    const userId = auth.userId

    const input = CreateParlayBodySchema.parse(req.body)
    const quote = await parlaysService.quote(userId ?? undefined, {
      ticketType: input.ticketType,
      legs: input.legs,
    })
    res.json(quote)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.issues })
      return
    }
    if (handleParlayError(res, error)) return
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/parlays
parlaysRouter.post('/', async (req: Request, res: Response) => {
  try {
    const auth = getAuth(req)
    const userId = auth.userId

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const input = CreateParlayBodySchema.parse(req.body)

    try {
      await usersService.ensureUserExists(userId, {})
    } catch {
      res.status(500).json({ error: 'Failed to initialize user account' })
      return
    }

    const parlay = await parlaysService.createParlay(userId, {
      ticketType: input.ticketType,
      legs: input.legs,
    })

    if (!parlay) {
      res.status(500).json({ error: 'Failed to create parlay' })
      return
    }

    res.json(parlay)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.issues })
      return
    }
    if (handleParlayError(res, error)) return
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/parlays
parlaysRouter.get('/', async (req: Request, res: Response) => {
  try {
    const auth = getAuth(req)
    const userId = auth.userId

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const parlays = await parlaysService.listParlays(userId)
    res.json(parlays)
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/parlays/:id
parlaysRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const auth = getAuth(req)
    const userId = auth.userId

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const parlay = await parlaysService.getParlayById(userId, req.params.id)
    if (!parlay) {
      res.status(404).json({ error: 'Parlay not found' })
      return
    }
    res.json(parlay)
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
})
