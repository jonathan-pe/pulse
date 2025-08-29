// import { User } from '@pulse/types'
import { Router, Request, Response } from 'express'
import { getAuth } from '@clerk/express'
import type { User } from '@pulse/types'

export const authRouter: import('express').Router = Router()

authRouter.get('/me', (req: Request, res: Response) => {
  const auth = getAuth(req)
  const user: Partial<User> = { id: auth.userId ?? '' }

  if (!auth.userId) return res.status(401).json({ error: 'unauthorized' })

  return res.json({ userId: auth.userId, user: user as User })
})
