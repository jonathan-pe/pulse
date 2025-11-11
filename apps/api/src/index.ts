// apps/api/src/index.ts
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { clerkMiddleware } from '@clerk/express'
import { router } from './routers'
import { createLogger } from './lib/logger'

const logger = createLogger('Server')

const PORT = Number(process.env.PORT ?? 4000)
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:5173'

const app = express()
app.use(cors({ origin: CORS_ORIGIN, credentials: true }))
app.use(express.json({ limit: '1mb' }))

// Attach Clerk only when configured; this adds req.auth and more
if (process.env.CLERK_PUBLISHABLE_KEY || process.env.CLERK_SECRET_KEY) {
  app.use(clerkMiddleware())
  logger.info('Clerk middleware enabled')
} else {
  // Helpful message during local development when Clerk isn't configured
  // so the server can still start without auth.
  // If you rely on Clerk for protected routes, ensure env vars are set.
  logger.warn('Clerk not configured - skipping authentication middleware')
}

app.use(router)

app.listen(PORT, () => {
  logger.info('Server started', { port: PORT, cors: CORS_ORIGIN, url: `http://localhost:${PORT}` })
})
