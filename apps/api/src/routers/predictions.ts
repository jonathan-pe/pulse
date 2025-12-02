import { Router, type Request, type Response } from 'express'
import type { Router as ExpressRouter } from 'express'
import { z } from 'zod'
import { getAuth } from '@clerk/express'
import { predictionsService } from '../services/predictions.service'
import { usersService } from '../services/users.service'

const PredictionInputSchema = z.object({
  gameId: z.string(),
  type: z.enum(['MONEYLINE', 'SPREAD', 'TOTAL']),
  pick: z.string(),
})

const BatchPredictionsSchema = z.object({
  predictions: z.array(PredictionInputSchema).min(1).max(20),
})

export const predictionsRouter: ExpressRouter = Router()

// POST /api/predictions - Create a single prediction
predictionsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const auth = getAuth(req)
    const userId = auth.userId

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const input = PredictionInputSchema.parse(req.body)

    const prediction = await predictionsService.createPrediction({
      userId,
      gameId: input.gameId,
      type: input.type,
      pick: input.pick,
    })

    res.json(prediction)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.issues })
      return
    }
    // Return validation errors with proper status code and message
    if (error instanceof Error) {
      const isValidationError =
        error.message.includes('Game') || error.message.includes('prediction') || error.message.includes('limit')
      if (isValidationError) {
        res.status(400).json({ error: error.message })
        return
      }
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/predictions/batch - Create multiple predictions at once
predictionsRouter.post('/batch', async (req: Request, res: Response) => {
  try {
    const auth = getAuth(req)
    const userId = auth.userId

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const input = BatchPredictionsSchema.parse(req.body)

    // Ensure user exists in database (safety check)
    try {
      await usersService.ensureUserExists(userId, {})
    } catch {
      res.status(500).json({ error: 'Failed to initialize user account' })
      return
    }

    const result = await predictionsService.createPredictions(userId, input.predictions)
    res.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.issues })
      return
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/predictions/daily-stats - Get daily stats for the current user
predictionsRouter.get('/daily-stats', async (req: Request, res: Response) => {
  try {
    const auth = getAuth(req)
    const userId = auth.userId

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const stats = await predictionsService.getDailyStats(userId)
    res.json(stats)
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/predictions/pending - Get pending (unlocked) predictions for the current user
predictionsRouter.get('/pending', async (req: Request, res: Response) => {
  try {
    const auth = getAuth(req)
    const userId = auth.userId

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const predictions = await predictionsService.getUserPredictions(userId, { pending: true })
    res.json(predictions)
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/predictions/history - Get all predictions for the current user
predictionsRouter.get('/history', async (req: Request, res: Response) => {
  try {
    const auth = getAuth(req)
    const userId = auth.userId

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const predictions = await predictionsService.getUserPredictions(userId)
    res.json(predictions)
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/predictions/game-ids - Get game IDs that the user has already predicted on
predictionsRouter.get('/game-ids', async (req: Request, res: Response) => {
  try {
    const auth = getAuth(req)
    const userId = auth.userId

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const gameIds = await predictionsService.getUserPredictedGameIds(userId)
    res.json(gameIds)
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/predictions/by-game - Get user's predictions grouped by game and type
predictionsRouter.get('/by-game', async (req: Request, res: Response) => {
  try {
    const auth = getAuth(req)
    const userId = auth.userId

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const predictions = await predictionsService.getUserPredictions(userId, { pending: true })

    // Group by gameId -> type -> pick
    const grouped: Record<string, Record<string, string>> = {}
    for (const pred of predictions) {
      if (!grouped[pred.gameId]) {
        grouped[pred.gameId] = {}
      }
      grouped[pred.gameId][pred.type] = pred.pick
    }

    res.json(grouped)
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
})
