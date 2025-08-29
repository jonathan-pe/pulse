// apps/api/src/index.ts
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { clerkMiddleware } from '@clerk/express'
import * as trpcExpress from '@trpc/server/adapters/express'
import { appRouter } from './router'
import { createContext } from './trpc'
import { ingestNatStat } from './jobs/ingest-natstat'

const PORT = Number(process.env.PORT ?? 4000)
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:5173'

const app = express()
app.use(cors({ origin: CORS_ORIGIN, credentials: true }))
app.use(express.json({ limit: '1mb' }))

// Attach Clerk only when configured; this adds req.auth and more
if (process.env.CLERK_PUBLISHABLE_KEY || process.env.CLERK_SECRET_KEY) {
  app.use(clerkMiddleware())
} else {
  // Helpful message during local development when Clerk isn't configured
  // so the server can still start without auth.
  // If you rely on Clerk for protected routes, ensure env vars are set.
  // eslint-disable-next-line no-console
  console.info('[api] CLERK not configured - skipping clerk middleware')
}

// Health route (public)
app.get('/health', (_req, res) => res.json({ ok: true }))

// Admin ingest endpoint protected by ADMIN_API_KEY header or query param
app.post('/admin/ingest-odds', async (req, res) => {
  const ADMIN_API_KEY = process.env.ADMIN_API_KEY ?? ''
  const key = req.headers['x-admin-api-key'] ?? req.query.apiKey ?? req.body.apiKey
  if (ADMIN_API_KEY && key !== ADMIN_API_KEY) {
    return res.status(401).json({ ok: false, error: 'unauthorized' })
  }

  const { date, league } = req.body ?? {}
  try {
    const result = await ingestNatStat({ date, league })
    return res.json(result)
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('[admin] ingest error', err)
    return res.status(500).json({ ok: false, error: String(err?.message ?? err) })
  }
})

// Ensure tRPC sees an `input` envelope. Some callers POST top-level JSON
// (e.g. { date, league, apiKey }) instead of the tRPC envelope { input: {...} }.
// Wrap top-level JSON into { input } so the tRPC adapter receives the payload.
app.use('/trpc', (req, _res, next) => {
  try {
    // Only wrap when the request is targeting the tRPC root (no subpath).
    // When calling a specific procedure like /trpc/admin.ingestNatstat, tRPC expects
    // the POST body to be the raw input object (not wrapped). Wrapping there
    // causes the resolver to receive an empty parsed input.
    const isRootTrpc = req.path === '/' || req.path === ''
    if (isRootTrpc && req.method === 'POST' && req.is('application/json') && req.body && req.body.input == null) {
      // only wrap if there's no existing input field
      req.body = { input: req.body }
    }
  } catch (err) {
    // swallow any body inspection errors — we'll still forward to trpc
  }

  next()
})

// tRPC
app.use(
  '/trpc',
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
  })
)

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.info(`[api] listening on http://localhost:${PORT}`)
})
