import { Router, type Request, type Response } from 'express'
import type { Router as ExpressRouter } from 'express'
import { z } from 'zod'
import { type Prisma, prisma } from '@/lib/db'
import { createLogger } from '../lib/logger'
import { oddsAggregationService } from '../services/odds-aggregation.service'
import type { TeamInfo, GameWithUnifiedOdds } from '@pulse/types'

const logger = createLogger('GamesRouter')

const listInputSchema = z.object({
  league: z.string().optional(),
  limit: z.coerce.number().optional(),
})

export const gamesRouter: ExpressRouter = Router()

// GET /api/games/upcoming - List upcoming games
gamesRouter.get('/upcoming', async (req: Request, res: Response) => {
  try {
    const input = listInputSchema.parse(req.query)

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
    res.json(gamesWithUnifiedOdds)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.issues })
      return
    }
    logger.error('Error fetching upcoming games', error instanceof Error ? error : undefined)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/games/:id - Get game by ID
gamesRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    logger.debug('Fetching game by ID', { gameId: id })

    const game = await prisma.game.findUnique({
      where: { id },
      include: {
        odds: true,
        result: true,
        homeTeam: true,
        awayTeam: true,
      },
    })

    if (!game) {
      logger.warn('Game not found', { gameId: id })
      res.status(404).json({ error: 'Game not found' })
      return
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

    logger.info('Game found', { gameId: id, league: game.league })
    res.json(gameWithUnifiedOdds)
  } catch (error) {
    logger.error('Error fetching game', error instanceof Error ? error : undefined)
    res.status(500).json({ error: 'Internal server error' })
  }
})
