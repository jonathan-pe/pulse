// Express
import { Router, Request, Response } from 'express'

export const expressHealthRouter: import('express').Router = Router()

expressHealthRouter.get('/', (_req: Request, res: Response) => {
  res.json({ healthy: true })
})

// tRPC
import { publicProcedure, router } from '../trpc'

export const trpcHealthRouter = router({
  check: publicProcedure.query(() => ({ healthy: true })),
})
