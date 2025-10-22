import { publicProcedure, router } from '../trpc'
import { z } from 'zod'
import { type Prisma, prisma } from '@pulse/db'

const listInput = z.object({
  league: z.string().optional(),
  limit: z.number().optional(),
})

export const gamesRouter = router({
  listUpcoming: publicProcedure.input(listInput).query(async ({ input }) => {
    const where: Prisma.GameWhereInput = { status: 'scheduled', startsAt: { gte: new Date() } }
    if (input.league) {
      // Use a case-insensitive comparison so callers can pass upper/lower case league values
      where.league = { equals: input.league, mode: 'insensitive' }
    }

    const games = await prisma.game.findMany({
      where,
      orderBy: { startsAt: 'asc' },
      take: input.limit ?? 50,
      include: { odds: true },
    })

    return games
  }),

  byId: publicProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    const game = await prisma.game.findUnique({ where: { id: input.id }, include: { odds: true, result: true } })

    return game
  }),
})
