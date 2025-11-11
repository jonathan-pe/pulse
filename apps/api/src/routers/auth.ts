import { Router, type Request, type Response } from 'express'
import { getAuth } from '@clerk/express'

export const authRouter = Router()

// GET /api/auth/me - Get current user info
authRouter.get('/me', (req: Request, res: Response) => {
  const auth = getAuth(req)
  const userId = auth.userId

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  res.json({
    userId,
    user: {
      id: userId,
    },
  })
})
