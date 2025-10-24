import { prisma } from '@pulse/db'

export interface GameInput {
  league: string
  startsAt: Date
  homeTeam: string
  awayTeam: string
  status?: string
}

export interface GameUpdateInput {
  status?: string
  startsAt?: Date
}

export interface GameScoreInput {
  homeScore: number
  awayScore: number
}

/**
 * GamesService - Handles all game-related business logic
 */
export class GamesService {
  /**
   * Find a game by unique identifying fields (league, startsAt, teams)
   */
  async findGame(input: GameInput) {
    return prisma.game.findFirst({
      where: {
        league: input.league,
        startsAt: input.startsAt,
        homeTeam: input.homeTeam,
        awayTeam: input.awayTeam,
      },
    })
  }

  /**
   * Find or create a game by unique identifying fields
   */
  async findOrCreateGame(input: GameInput) {
    const existing = await this.findGame(input)

    if (existing) {
      return existing
    }

    return prisma.game.create({
      data: {
        league: input.league,
        startsAt: input.startsAt,
        homeTeam: input.homeTeam,
        awayTeam: input.awayTeam,
        status: input.status ?? 'scheduled',
      },
    })
  }

  /**
   * Update game metadata (status, start time) if values have changed
   * Returns true if any updates were made
   */
  async updateGameMetadata(gameId: string, currentGame: { status: string; startsAt: Date }, updates: GameUpdateInput) {
    const changes: Record<string, unknown> = {}

    if (updates.status && updates.status !== currentGame.status) {
      changes.status = updates.status
    }

    if (updates.startsAt && updates.startsAt.getTime() !== currentGame.startsAt.getTime()) {
      changes.startsAt = updates.startsAt
    }

    if (Object.keys(changes).length > 0) {
      await prisma.game.update({
        where: { id: gameId },
        data: changes,
      })
      return true
    }

    return false
  }

  /**
   * Upsert game result/scores
   * Returns true if scores were created or updated
   */
  async upsertGameScores(gameId: string, scores: GameScoreInput) {
    const existingResult = await prisma.result.findUnique({
      where: { gameId },
    })

    if (!existingResult) {
      await prisma.result.create({
        data: {
          gameId,
          homeScore: scores.homeScore,
          awayScore: scores.awayScore,
        },
      })
      return true
    }

    if (existingResult.homeScore !== scores.homeScore || existingResult.awayScore !== scores.awayScore) {
      await prisma.result.update({
        where: { gameId },
        data: {
          homeScore: scores.homeScore,
          awayScore: scores.awayScore,
        },
      })
      return true
    }

    return false
  }
}

// Export a singleton instance
export const gamesService = new GamesService()
