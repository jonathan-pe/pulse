// apps/api/src/router.ts
import { router } from './trpc'
import { healthRouter } from './routers/health'
import { authRouter } from './routers/auth'
import { gamesRouter } from './routers/games'
import { predictionsRouter } from './routers/predictions'
import { pointsRouter } from './routers/points'
import { adminRouter } from './routers/admin'

export const appRouter = router({
  health: healthRouter,
  auth: authRouter,
  admin: adminRouter,
  games: gamesRouter,
  predictions: predictionsRouter,
  points: pointsRouter,
})

export type AppRouter = typeof appRouter
