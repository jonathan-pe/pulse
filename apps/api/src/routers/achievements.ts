import { Router, type Request, type Response, type Router as ExpressRouter } from 'express'
import { requireAuth, getAuth } from '@clerk/express'
import { achievementsService } from '../services/index.js'
import { updateDisplayedAchievementsSchema } from '@pulse/types'
import { createLogger } from '../lib/logger.js'

const logger = createLogger('AchievementsRouter')
export const achievementsRouter: ExpressRouter = Router()

/**
 * GET /achievements
 * Get all achievements with user's progress
 */
achievementsRouter.get('/', requireAuth(), async (req: Request, res: Response) => {
  try {
    const auth = getAuth(req)
    const userId = auth.userId!

    const achievements = await achievementsService.getAchievementsWithProgress(userId)

    res.json({
      success: true,
      data: achievements,
    })
  } catch (error) {
    logger.error('Error fetching achievements', { error })
    res.status(500).json({
      success: false,
      error: 'Failed to fetch achievements',
    })
  }
})

/**
 * GET /achievements/showcase
 * Get user's achievement showcase for profile display
 */
achievementsRouter.get('/showcase', requireAuth(), async (req: Request, res: Response) => {
  try {
    const auth = getAuth(req)
    const userId = auth.userId!

    const showcase = await achievementsService.getAchievementShowcase(userId)

    res.json({
      success: true,
      data: showcase,
    })
  } catch (error) {
    logger.error('Error fetching achievement showcase', { error })
    res.status(500).json({
      success: false,
      error: 'Failed to fetch achievement showcase',
    })
  }
})

/**
 * GET /achievements/stats
 * Get achievement statistics for current user
 */
achievementsRouter.get('/stats', requireAuth(), async (req: Request, res: Response) => {
  try {
    const auth = getAuth(req)
    const userId = auth.userId!

    const stats = await achievementsService.getAchievementStats(userId)

    res.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    logger.error('Error fetching achievement stats', { error })
    res.status(500).json({
      success: false,
      error: 'Failed to fetch achievement stats',
    })
  }
})

/**
 * POST /achievements/display
 * Update user's displayed achievements on profile
 */
achievementsRouter.post('/display', requireAuth(), async (req: Request, res: Response) => {
  try {
    const auth = getAuth(req)
    const userId = auth.userId!

    // Validate request body
    const result = updateDisplayedAchievementsSchema.safeParse(req.body)

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request body',
        details: result.error.issues,
      })
    }

    await achievementsService.updateDisplayedAchievements(userId, result.data.achievementIds)

    res.json({
      success: true,
      message: 'Displayed achievements updated successfully',
    })
  } catch (error) {
    logger.error('Error updating displayed achievements', { error })

    const message = error instanceof Error ? error.message : 'Failed to update displayed achievements'
    const status = message.includes('Cannot display') ? 400 : 500

    res.status(status).json({
      success: false,
      error: message,
    })
  }
})

/**
 * POST /achievements/check
 * Manually trigger achievement check for current user
 * (Primarily for testing/debugging)
 */
achievementsRouter.post('/check', requireAuth(), async (req: Request, res: Response) => {
  try {
    const auth = getAuth(req)
    const userId = auth.userId!

    const newAchievements = await achievementsService.checkAndUnlockAchievements(userId)

    res.json({
      success: true,
      data: {
        newAchievements,
        count: newAchievements.length,
      },
    })
  } catch (error) {
    logger.error('Error checking achievements', { error })
    res.status(500).json({
      success: false,
      error: 'Failed to check achievements',
    })
  }
})
