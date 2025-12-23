import { Router, type Request, type Response } from 'express'
import type { Router as ExpressRouter } from 'express'
import { getAuth, clerkClient } from '@clerk/express'
import { usersService } from '../services/users.service'
import { createLogger } from '../lib/logger'
import { prisma } from '@/lib/db'

const logger = createLogger('AuthRouter')

export const authRouter: ExpressRouter = Router()

// GET /api/auth/me - Get current user info (returns full user profile from DB)
authRouter.get('/me', async (req: Request, res: Response) => {
  const auth = getAuth(req)
  const userId = auth.userId

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  try {
    const user = await usersService.getUserById(userId)

    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    res.json(user)
  } catch (error) {
    logger.error('Failed to get user', { userId, error })
    res.status(500).json({ error: 'Failed to get user' })
  }
})

// PATCH /api/auth/me - Update current user profile
authRouter.patch('/me', async (req: Request, res: Response) => {
  const auth = getAuth(req)
  const userId = auth.userId

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  try {
    const { username, displayName } = req.body

    // Validate input
    if (username !== undefined && typeof username !== 'string') {
      res.status(400).json({ error: 'Username must be a string' })
      return
    }

    if (displayName !== undefined && displayName !== null && typeof displayName !== 'string') {
      res.status(400).json({ error: 'Display name must be a string or null' })
      return
    }

    // Username validation
    if (username !== undefined) {
      if (username.length < 3 || username.length > 20) {
        res.status(400).json({ error: 'Username must be between 3 and 20 characters' })
        return
      }
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores' })
        return
      }

      // Check if username is already taken by another user
      const existingUser = await prisma.user.findFirst({
        where: {
          username,
          id: { not: userId },
        },
      })

      if (existingUser) {
        res.status(400).json({ error: 'Username is already taken' })
        return
      }
    }

    // Display name validation
    if (displayName !== undefined && displayName !== null && displayName.length > 50) {
      res.status(400).json({ error: 'Display name must be at most 50 characters' })
      return
    }

    const user = await usersService.updateUser(userId, { username, displayName })
    res.json(user)
  } catch (error) {
    logger.error('Failed to update user', { userId, error })
    res.status(500).json({ error: 'Failed to update user' })
  }
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
