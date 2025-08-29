// apps/api/src/index.ts
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { clerkMiddleware, requireAuth } from '@clerk/express'
import { healthRouter } from './routers/health'
import { authRouter } from './routers/auth'
import { gamesRouter } from './routers/games'
import { predictionsRouter } from './routers/predictions'
import { pointsRouter } from './routers/points'
import { adminRouter } from './routers/admin'

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

// Mount express routers
app.use('/health', healthRouter)
app.use('/admin', adminRouter)
app.use('/auth', requireAuth(), authRouter)
app.use('/games', requireAuth(), gamesRouter)
app.use('/predictions', requireAuth(), predictionsRouter)
app.use('/points', requireAuth(), pointsRouter)

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.info(`[api] listening on http://localhost:${PORT}`)
})
