import { publicProcedure, router } from '../trpc'
import { z } from 'zod'
import { type Prisma, prisma } from '@pulse/db'
import type { GameWithUnifiedOdds } from '@pulse/types'
import { createLogger } from '../lib/logger'
import { oddsAggregationService } from '../services/odds-aggregation.service'

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

    // Transform each game to have unified odds instead of provider-specific odds
    const gamesWithUnifiedOdds: GameWithUnifiedOdds[] = games.map((game) => ({
      id: game.id,
      league: game.league,
      startsAt: game.startsAt,
      homeTeam: game.homeTeam,
      awayTeam: game.awayTeam,
      status: game.status,
      odds: oddsAggregationService.aggregateOdds(game.odds),
    }))

    logger.info('Upcoming games fetched', { count: gamesWithUnifiedOdds.length, league: input.league })
    return gamesWithUnifiedOdds
  }),

  byId: publicProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    logger.debug('Fetching game by ID', { gameId: input.id })

    const game = await prisma.game.findUnique({ where: { id: input.id }, include: { odds: true, result: true } })

    if (!game) {
      logger.warn('Game not found', { gameId: input.id })
      return null
    }

    // Transform to unified odds
    const gameWithUnifiedOdds: GameWithUnifiedOdds = {
      id: game.id,
      league: game.league,
      startsAt: game.startsAt,
      homeTeam: game.homeTeam,
      awayTeam: game.awayTeam,
      status: game.status,
      odds: oddsAggregationService.aggregateOdds(game.odds),
      result: game.result,
    }

    logger.info('Game found', { gameId: input.id, league: game.league })
    return gameWithUnifiedOdds
  }),
})
