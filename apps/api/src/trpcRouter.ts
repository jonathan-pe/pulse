import { router } from './trpc'
import { trpcHealthRouter } from './routers/health'
import { authRouter } from './routers/auth'
import { gamesRouter } from './routers/games'
import { predictionsRouter } from './routers/predictions'
import { pointsRouter } from './routers/points'

export const appRouter = router({
  health: trpcHealthRouter,
  auth: authRouter,
  games: gamesRouter,
  predictions: predictionsRouter,
  points: pointsRouter,
})

export type AppRouter = typeof appRouter
