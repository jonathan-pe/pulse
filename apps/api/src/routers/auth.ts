import { Router, type Request, type Response } from 'express'
import type { Router as ExpressRouter } from 'express'
import { getAuth, clerkClient } from '@clerk/express'
import { usersService } from '../services/users.service'
import { createLogger } from '../lib/logger'

const logger = createLogger('AuthRouter')

export const authRouter: ExpressRouter = Router()

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

// DELETE /api/auth/me - Delete current user account and all associated data
authRouter.delete('/me', async (req: Request, res: Response) => {
  const auth = getAuth(req)
  const userId = auth.userId

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  try {
    logger.info('User initiated account deletion', { userId })

    // First delete from our database (cascades to predictions, ledger, achievements)
    await usersService.deleteUser(userId)

    // Then delete from Clerk
    await clerkClient.users.deleteUser(userId)

    logger.info('User account fully deleted', { userId })

    res.json({ success: true, message: 'Account deleted successfully' })
  } catch (error) {
    logger.error('Failed to delete user account', { userId, error })
    res.status(500).json({ error: 'Failed to delete account' })
  }
})
