import { Router, Request, Response } from 'express'
import type { Router as ExpressRouter } from 'express'
import { ingestNatStat } from '../jobs/ingest-natstat'
import { createLogger } from '../lib/logger'
import { scoreGameService } from '../services/score-game.service'
import { prisma } from '@pulse/db'

const logger = createLogger('AdminRouter')

export const adminRouter: ExpressRouter = Router()

const LOOKAHEAD_DAYS = 7

// POST /admin/ingest-natstat
adminRouter.post('/ingest-natstat', async (req: Request, res: Response) => {
  const CRON_TOKEN = process.env.CRON_TOKEN
  const key = req.headers['x-cron-token'] ?? req.query.cronToken ?? req.body.cronToken
  if (CRON_TOKEN && key !== CRON_TOKEN) {
    return res.status(401).json({ ok: false, error: 'unauthorized' })
  }

  const { league } = req.body ?? {}
  try {
    // Build a single comma-separated date range: today -> 7 days ahead
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(start.getDate() + LOOKAHEAD_DAYS)

    const isoStart = start.toISOString().slice(0, 10)
    const isoEnd = end.toISOString().slice(0, 10)
    const range = `${isoStart},${isoEnd}`

    logger.info('Starting NatStat ingestion', { range, league: league ?? 'all', lookaheadDays: LOOKAHEAD_DAYS })
    const result = await ingestNatStat({ date: range, league })
    logger.info('NatStat ingestion completed', { range, league, counts: result.counts })
    return res.json({ ok: true, range, result })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    logger.error('NatStat ingestion failed', err instanceof Error ? err : undefined, { league, range: 'unknown' })
    return res.status(500).json({ ok: false, error: message })
  }
})

// POST /admin/games/:id/results - Set game result and optionally score predictions
adminRouter.post('/games/:id/results', async (req: Request, res: Response) => {
  const adminKey = req.headers['x-admin-key'] ?? req.query.adminKey ?? req.body.adminKey
  const ADMIN_API_KEY = process.env.ADMIN_API_KEY

  if (ADMIN_API_KEY && adminKey !== ADMIN_API_KEY) {
    return res.status(401).json({ ok: false, error: 'unauthorized' })
  }

  const { id: gameId } = req.params
  const { homeScore, awayScore, autoScore = true } = req.body

  if (typeof homeScore !== 'number' || typeof awayScore !== 'number') {
    return res.status(400).json({ ok: false, error: 'homeScore and awayScore must be numbers' })
  }

  try {
    // Check if game exists
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: { result: true },
    })

    if (!game) {
      return res.status(404).json({ ok: false, error: 'game not found' })
    }

    // Create or update result
    const result = await prisma.result.upsert({
      where: { gameId },
      create: {
        gameId,
        homeScore,
        awayScore,
      },
      update: {
        homeScore,
        awayScore,
      },
    })

    // Update game status to final
    await prisma.game.update({
      where: { id: gameId },
      data: { status: 'final' },
    })

    logger.info('Game result set', { gameId, homeScore, awayScore })

    // Automatically score if requested
    if (autoScore) {
      const scoringResult = await scoreGameService.scoreCompletedGame(gameId)
      return res.json({
        ok: true,
        result,
        scoring: scoringResult,
      })
    }

    return res.json({ ok: true, result })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    logger.error('Failed to set game result', err instanceof Error ? err : undefined, { gameId })
    return res.status(500).json({ ok: false, error: message })
  }
})

// POST /admin/games/:id/score - Score predictions for a completed game
adminRouter.post('/games/:id/score', async (req: Request, res: Response) => {
  const adminKey = req.headers['x-admin-key'] ?? req.query.adminKey ?? req.body.adminKey
  const ADMIN_API_KEY = process.env.ADMIN_API_KEY

  if (ADMIN_API_KEY && adminKey !== ADMIN_API_KEY) {
    return res.status(401).json({ ok: false, error: 'unauthorized' })
  }

  const { id: gameId } = req.params

  try {
    const result = await scoreGameService.scoreCompletedGame(gameId)
    return res.json({ ok: true, result })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    logger.error('Failed to score game', err instanceof Error ? err : undefined, { gameId })
    return res.status(500).json({ ok: false, error: message })
  }
})

// POST /admin/score-all - Score all games ready to be scored
adminRouter.post('/score-all', async (req: Request, res: Response) => {
  const adminKey = req.headers['x-admin-key'] ?? req.query.adminKey ?? req.body.adminKey
  const ADMIN_API_KEY = process.env.ADMIN_API_KEY

  if (ADMIN_API_KEY && adminKey !== ADMIN_API_KEY) {
    return res.status(401).json({ ok: false, error: 'unauthorized' })
  }

  try {
    const gameIds = await scoreGameService.findGamesReadyToScore()
    logger.info('Found games ready to score', { count: gameIds.length })

    const results = await scoreGameService.scoreMultipleGames(gameIds)

    const summary = {
      totalGames: results.length,
      totalPredictions: results.reduce((sum, r) => sum + r.totalPredictions, 0),
      totalScored: results.reduce((sum, r) => sum + r.scored, 0),
      totalSkipped: results.reduce((sum, r) => sum + r.skipped, 0),
      totalPoints: results.reduce((sum, r) => sum + r.totalPointsAwarded, 0),
      errors: results.flatMap((r) => r.errors),
    }

    return res.json({ ok: true, summary, results })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    logger.error('Failed to score all games', err instanceof Error ? err : undefined)
    return res.status(500).json({ ok: false, error: message })
  }
})
