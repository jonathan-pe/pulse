import { Router, Request, Response } from 'express'
import { ingestNatStat } from '../jobs/ingest-natstat'

// /admin
export const adminRouter: import('express').Router = Router()

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

    console.info(`[admin] ingesting natstat range ${range} league=${league ?? 'all'}`)
    const result = await ingestNatStat({ date: range, league })
    return res.json({ ok: true, range, result })
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('[admin] ingest error', err)
    return res.status(500).json({ ok: false, error: String(err?.message ?? err) })
  }
})
