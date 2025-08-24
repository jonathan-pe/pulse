import { protectedProcedure, publicProcedure, router } from '../trpc'
import { z } from 'zod'
import { prisma } from '@pulse/db'

export const pointsRouter = router({
  myPoints: protectedProcedure.query(async ({ ctx }) => {
    const sum = await prisma.pointsLedger.aggregate({ where: { userId: ctx.userId ?? '' }, _sum: { delta: true } })
    return { points: sum._sum.delta ?? 0 }
  }),

  leaderboard: publicProcedure.input(z.object({ limit: z.number().optional() })).query(async ({ input }) => {
    const limit = input.limit ?? 10

    // Simple leaderboard: sum points per user, order desc
    const rows = await prisma.$queryRaw`
        SELECT "userId", SUM("delta") as points
        FROM "PointsLedger"
        GROUP BY "userId"
        ORDER BY points DESC
        LIMIT ${limit}
      `

    return rows
  }),
})
