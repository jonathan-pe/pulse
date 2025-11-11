import { Router } from 'express'
import { adminRouter } from './admin'
import { healthRouter } from './health'
import { webhooksRouter } from './webhooks'
import { authRouter } from './auth'
import { gamesRouter } from './games'
import { predictionsRouter } from './predictions'
import { pointsRouter } from './points'

export const router = Router()

router.use('/health', healthRouter)
router.use('/admin', adminRouter)
router.use('/webhooks', webhooksRouter)
router.use('/auth', authRouter)
router.use('/games', gamesRouter)
router.use('/predictions', predictionsRouter)
router.use('/points', pointsRouter)
