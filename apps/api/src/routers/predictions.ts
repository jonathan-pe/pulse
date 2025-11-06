import { protectedProcedure, router } from '../trpc'
import { z } from 'zod'
import { predictionsService } from '../services/predictions.service'
import { usersService } from '../services/users.service'
import { TRPCError } from '@trpc/server'

const PredictionInputSchema = z.object({
  gameId: z.string(),
  type: z.enum(['MONEYLINE', 'SPREAD', 'TOTAL']),
  pick: z.string(),
})

export const predictionsRouter = router({
  /**
   * Create a single prediction
   */
  create: protectedProcedure.input(PredictionInputSchema).mutation(async ({ input, ctx }) => {
    const userId = ctx.userId
    if (!userId) {
      throw new Error('Unauthorized')
    }

    const prediction = await predictionsService.createPrediction({
      userId,
      gameId: input.gameId,
      type: input.type,
      pick: input.pick,
    })

    return prediction
  }),

  /**
   * Create multiple predictions at once (batch operation)
   */
  createBatch: protectedProcedure
    .input(
      z.object({
        predictions: z.array(PredictionInputSchema).min(1).max(20), // Max 20 at a time to prevent abuse
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.userId
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      // Ensure user exists in database (safety check)
      // Ideally this should be done via Clerk webhooks on signup
      try {
        await usersService.ensureUserExists(userId, {})
      } catch {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to initialize user account',
        })
      }

      const result = await predictionsService.createPredictions(userId, input.predictions)
      return result
    }),

  /**
   * Get daily stats for the current user
   */
  dailyStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId
    if (!userId) {
      throw new Error('Unauthorized')
    }

    return predictionsService.getDailyStats(userId)
  }),

  /**
   * Get pending (unlocked) predictions for the current user
   */
  myPending: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId
    if (!userId) {
      throw new Error('Unauthorized')
    }

    return predictionsService.getUserPredictions(userId, { pending: true })
  }),

  /**
   * Get all predictions for the current user
   */
  myHistory: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId
    if (!userId) {
      throw new Error('Unauthorized')
    }

    return predictionsService.getUserPredictions(userId)
  }),

  /**
   * Get game IDs that the user has already predicted on
   */
  myPredictedGameIds: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId
    if (!userId) {
      throw new Error('Unauthorized')
    }

    return predictionsService.getUserPredictedGameIds(userId)
  }),

  /**
   * Get user's predictions grouped by game and type
   * Returns a map of gameId -> type -> pick for quick lookup
   */
  myPredictionsByGame: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId
    if (!userId) {
      throw new Error('Unauthorized')
    }

    const predictions = await predictionsService.getUserPredictions(userId, { pending: true })

    // Group by gameId -> type -> pick
    const grouped: Record<string, Record<string, string>> = {}
    for (const pred of predictions) {
      if (!grouped[pred.gameId]) {
        grouped[pred.gameId] = {}
      }
      grouped[pred.gameId][pred.type] = pred.pick
    }

    return grouped
  }),
})
