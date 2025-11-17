import { Router, Request, Response } from 'express'
import type { Router as ExpressRouter } from 'express'
import { ingestNatStat } from '../jobs/ingest-natstat'
import { createLogger } from '../lib/logger'

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
