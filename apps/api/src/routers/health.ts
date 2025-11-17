import { Router, Request, Response } from 'express'
import type { Router as ExpressRouter } from 'express'

export const healthRouter: ExpressRouter = Router()

healthRouter.get('/', (_req: Request, res: Response) => {
  res.json({ healthy: true })
})
