import { publicProcedure, router } from '../trpc'
import { z } from 'zod'
import { type Prisma, prisma } from '@pulse/db'
import { createLogger } from '../lib/logger'

const logger = createLogger('GamesRouter')

const listInput = z.object({
  league: z.string().optional(),
  limit: z.number().optional(),
})

export const gamesRouter = router({
  listUpcoming: publicProcedure.input(listInput).query(async ({ input }) => {
    logger.debug('Fetching upcoming games', { league: input.league, limit: input.limit })

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

    logger.info('Upcoming games fetched', { count: games.length, league: input.league })
    return games
  }),

  byId: publicProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    logger.debug('Fetching game by ID', { gameId: input.id })

    const game = await prisma.game.findUnique({ where: { id: input.id }, include: { odds: true, result: true } })

    if (game) {
      logger.info('Game found', { gameId: input.id, league: game.league })
    } else {
      logger.warn('Game not found', { gameId: input.id })
    }

    return game
  }),
})
