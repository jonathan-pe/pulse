import { publicProcedure, router } from '../trpc'
import { z } from 'zod'
import { type Prisma, prisma } from '@pulse/db'
import { createLogger } from '../lib/logger'
import { oddsAggregationService } from '../services/odds-aggregation.service'
import { getTeamMetadata } from '../services/teams.service'

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

    // Transform each game to have unified odds and team logos
    const gamesWithUnifiedOdds = await Promise.all(
      games.map(async (game) => {
        // Fetch team metadata for logos
        const [homeTeamData, awayTeamData] = await Promise.all([
          getTeamMetadata(game.league, game.homeTeam),
          getTeamMetadata(game.league, game.awayTeam),
        ])

        return {
          id: game.id,
          league: game.league,
          startsAt: game.startsAt,
          homeTeam: game.homeTeam,
          awayTeam: game.awayTeam,
          status: game.status,
          odds: oddsAggregationService.aggregateOdds(game.odds),
          homeTeamLogo: homeTeamData?.badgeUrl ?? null,
          homeTeamCode: homeTeamData?.code ?? null,
          awayTeamLogo: awayTeamData?.badgeUrl ?? null,
          awayTeamCode: awayTeamData?.code ?? null,
        }
      })
    )

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

    // Fetch team metadata for logos
    const [homeTeamData, awayTeamData] = await Promise.all([
      getTeamMetadata(game.league, game.homeTeam),
      getTeamMetadata(game.league, game.awayTeam),
    ])

    // Transform to unified odds with team logos
    const gameWithUnifiedOdds = {
      id: game.id,
      league: game.league,
      startsAt: game.startsAt,
      homeTeam: game.homeTeam,
      awayTeam: game.awayTeam,
      status: game.status,
      odds: oddsAggregationService.aggregateOdds(game.odds),
      result: game.result,
      homeTeamLogo: homeTeamData?.badgeUrl ?? null,
      homeTeamCode: homeTeamData?.code ?? null,
      awayTeamLogo: awayTeamData?.badgeUrl ?? null,
      awayTeamCode: awayTeamData?.code ?? null,
    }

    logger.info('Game found', { gameId: input.id, league: game.league })
    return gameWithUnifiedOdds
  }),
})
