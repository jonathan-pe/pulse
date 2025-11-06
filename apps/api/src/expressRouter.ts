import { adminRouter } from 'apps/api/src/routers/admin'
import { expressHealthRouter } from 'apps/api/src/routers/health'
import { webhooksRouter } from 'apps/api/src/routers/webhooks'
import { Router } from 'express'

export const expressRouter: import('express').Router = Router()

expressRouter.use('/health', expressHealthRouter)
expressRouter.use('/admin', adminRouter)
expressRouter.use('/webhooks', webhooksRouter)
