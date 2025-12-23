import type { Router as ExpressRouter, Request, Response } from 'express'
import { Router } from 'express'
import { usersService } from '../services/users.service'
import { createLogger } from '../lib/logger'
import type { WebhookEvent } from '@clerk/express'

const logger = createLogger('WebhooksRouter')

export const webhooksRouter: ExpressRouter = Router()

/**
 * Verify Clerk webhook signature (production only)
 * For local development with ngrok, you can skip this or use the signing secret
 *
 * Uncomment and configure when deploying:
 *
 * import { Webhook } from 'svix'
 *
 * const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!)
 * const payload = wh.verify(JSON.stringify(req.body), {
 *   "svix-id": req.headers["svix-id"],
 *   "svix-timestamp": req.headers["svix-timestamp"],
 *   "svix-signature": req.headers["svix-signature"],
 * })
 */

/**
 * Handle Clerk webhooks for user lifecycle events
 * POST /webhooks/clerk
 *
 * This endpoint should be called by Clerk when users are created/updated/deleted
 * Security: Validate webhook signatures in production (using Clerk's svix library)
 */
webhooksRouter.post('/clerk', async (req: Request, res: Response) => {
  try {
    // Clerk sends WebhookEvent type
    const evt = req.body as WebhookEvent

    logger.info('Received webhook event', { type: evt.type, userId: evt.data.id })

    switch (evt.type) {
      case 'user.created': {
        // Extract user data from Clerk user object
        const primaryEmail =
          evt.data.email_addresses.find((e) => e.id === evt.data.primary_email_address_id)?.email_address ||
          evt.data.email_addresses[0]?.email_address ||
          `${evt.data.id}@clerk.user`

        // Create user in our database with all available fields
        await usersService.ensureUserExists(evt.data.id, {
          email: primaryEmail,
          username: evt.data.username,
          imageUrl: evt.data.image_url,
        })

        logger.info('User created via webhook', { userId: evt.data.id, email: primaryEmail })
        break
      }

      case 'user.updated': {
        // Update user data if any fields changed
        const primaryEmail =
          evt.data.email_addresses.find((e) => e.id === evt.data.primary_email_address_id)?.email_address ||
          evt.data.email_addresses[0]?.email_address

        await usersService.ensureUserExists(evt.data.id, {
          email: primaryEmail,
          username: evt.data.username,
          imageUrl: evt.data.image_url,
        })

        logger.info('User updated via webhook', { userId: evt.data.id, email: primaryEmail })
        break
      }

      case 'user.deleted': {
        // evt.data is just { id, deleted: true } for deletion events
        if (evt.data.id) {
          await usersService.deleteUser(evt.data.id)
          logger.info('User deleted via webhook', { userId: evt.data.id })
        }
        break
      }

      default:
        logger.debug('Unhandled webhook event type', { type: evt.type })
    }

    return res.status(200).json({ success: true })
  } catch (error) {
    logger.error('Webhook processing failed', { error })
    return res.status(500).json({ error: 'Internal server error' })
  }
})
