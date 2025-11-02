import { publicProcedure, router } from '../trpc'
import { z } from 'zod'
import { type Prisma, prisma } from '@pulse/db'
import { createLogger } from '../lib/logger'
import { oddsAggregationService } from '../services/odds-aggregation.service'
import type { TeamInfo, GameWithUnifiedOdds } from '@pulse/types'

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
      include: {
        odds: true,
        homeTeam: true,
        awayTeam: true,
      },
    })

    // Transform each game to have unified odds and team info
    const gamesWithUnifiedOdds: GameWithUnifiedOdds[] = games.map((game) => {
      const homeTeam: TeamInfo = {
        id: game.homeTeam.id,
        code: game.homeTeam.code,
        name: game.homeTeam.name,
        nickname: game.homeTeam.nickname ?? undefined,
        city: game.homeTeam.city ?? undefined,
        logoUrl: game.homeTeam.logoUrl ?? undefined,
        primaryColor: game.homeTeam.primaryColor ?? undefined,
      }

      const awayTeam: TeamInfo = {
        id: game.awayTeam.id,
        code: game.awayTeam.code,
        name: game.awayTeam.name,
        nickname: game.awayTeam.nickname ?? undefined,
        city: game.awayTeam.city ?? undefined,
        logoUrl: game.awayTeam.logoUrl ?? undefined,
        primaryColor: game.awayTeam.primaryColor ?? undefined,
      }

      return {
        id: game.id,
        league: game.league,
        startsAt: game.startsAt,
        homeTeam,
        awayTeam,
        status: game.status,
        odds: oddsAggregationService.aggregateOdds(game.odds),
      }
    })

    logger.info('Upcoming games fetched', { count: gamesWithUnifiedOdds.length, league: input.league })
    return gamesWithUnifiedOdds
  }),

  byId: publicProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    logger.debug('Fetching game by ID', { gameId: input.id })

    const game = await prisma.game.findUnique({
      where: { id: input.id },
      include: {
        odds: true,
        result: true,
        homeTeam: true,
        awayTeam: true,
      },
    })

    if (!game) {
      logger.warn('Game not found', { gameId: input.id })
      return null
    }

    const homeTeam: TeamInfo = {
      id: game.homeTeam.id,
      code: game.homeTeam.code,
      name: game.homeTeam.name,
      nickname: game.homeTeam.nickname ?? undefined,
      city: game.homeTeam.city ?? undefined,
      logoUrl: game.homeTeam.logoUrl ?? undefined,
      primaryColor: game.homeTeam.primaryColor ?? undefined,
    }

    const awayTeam: TeamInfo = {
      id: game.awayTeam.id,
      code: game.awayTeam.code,
      name: game.awayTeam.name,
      nickname: game.awayTeam.nickname ?? undefined,
      city: game.awayTeam.city ?? undefined,
      logoUrl: game.awayTeam.logoUrl ?? undefined,
      primaryColor: game.awayTeam.primaryColor ?? undefined,
    }

    // Transform to unified odds with team info
    const gameWithUnifiedOdds: GameWithUnifiedOdds = {
      id: game.id,
      league: game.league,
      startsAt: game.startsAt,
      homeTeam,
      awayTeam,
      status: game.status,
      odds: oddsAggregationService.aggregateOdds(game.odds),
      result: game.result,
    }

    logger.info('Game found', { gameId: input.id, league: game.league })
    return gameWithUnifiedOdds
  }),
})
