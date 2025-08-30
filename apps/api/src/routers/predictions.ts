import { protectedProcedure, router } from '../trpc'
import { z } from 'zod'
import { prisma } from '@pulse/db'

export const predictionsRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        gameId: z.string(),
        type: z.enum(['MONEYLINE', 'SPREAD', 'TOTAL']),
        pick: z.string(),
        stakePoints: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const created = await prisma.prediction.create({
        data: {
          userId: ctx.userId ?? '',
          gameId: input.gameId,
          type: input.type,
          pick: input.pick,
          stakePoints: input.stakePoints ?? 1,
        },
      })

      return created
    }),

  myPending: protectedProcedure.query(async ({ ctx }) => {
    const preds = await prisma.prediction.findMany({
      where: { userId: ctx.userId ?? '', lockedAt: null },
      orderBy: { createdAt: 'desc' },
    })
    return preds
  }),

  myHistory: protectedProcedure.query(async ({ ctx }) => {
    const preds = await prisma.prediction.findMany({
      where: { userId: ctx.userId ?? '' },
      orderBy: { createdAt: 'desc' },
    })
    return preds
  }),
})
