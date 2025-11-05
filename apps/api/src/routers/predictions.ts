import { protectedProcedure, router } from '../trpc'
import { z } from 'zod'
import { predictionsService } from '../services/predictions.service'

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
        throw new Error('Unauthorized')
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
})
