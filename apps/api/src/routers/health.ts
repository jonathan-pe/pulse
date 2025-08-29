// apps/api/src/routers/health.ts
import { Router, Request, Response } from 'express'

export const healthRouter: import('express').Router = Router()

healthRouter.get('/', (_req: Request, res: Response) => {
  res.json({ healthy: true })
})
