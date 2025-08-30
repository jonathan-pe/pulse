// apps/api/src/index.ts
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { clerkMiddleware } from '@clerk/express'
import { expressRouter } from 'apps/api/src/expressRouter'
import * as trpcExpress from '@trpc/server/adapters/express'
import { appRouter } from './trpcRouter'
import { createContext } from 'apps/api/src/trpc'

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

app.use(expressRouter)
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
