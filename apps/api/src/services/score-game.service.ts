import { prisma } from '@pulse/db'
import { createLogger } from '../lib/logger'
import { pointsService } from './points.service'
import type { PredictionWithGame as BasePredictionWithGame } from './points.service'

const logger = createLogger('ScoreGameService')

// Extend the interface to include createdAt
interface PredictionWithGame extends BasePredictionWithGame {
  createdAt: Date
}

export interface GameScoringResult {
  gameId: string
  totalPredictions: number
  scored: number
  skipped: number
  totalPointsAwarded: number
  errors: string[]
}

/**
 * ScoreGameService - Handles scoring predictions for completed games
 */
export class ScoreGameService {
  /**
   * Score all predictions for a completed game
   *
   * @param gameId - The game ID to score
   * @returns Scoring summary
   */
  async scoreCompletedGame(gameId: string): Promise<GameScoringResult> {
    const result: GameScoringResult = {
      gameId,
      totalPredictions: 0,
      scored: 0,
      skipped: 0,
      totalPointsAwarded: 0,
      errors: [],
    }

    // Verify game has a result
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: { result: true },
    })

    if (!game) {
      throw new Error(`Game ${gameId} not found`)
    }

    if (!game.result) {
      throw new Error(`Game ${gameId} has no result yet`)
    }

    // Check if already scored
    if (game.result.scoredAt) {
      logger.warn('Game already scored, skipping', {
        gameId,
        scoredAt: game.result.scoredAt,
      })
      return result
    }

    // Lock any unlocked predictions for this game (retroactive for historical games)
    const lockResult = await prisma.prediction.updateMany({
      where: {
        gameId,
        lockedAt: null,
      },
      data: {
        lockedAt: new Date(),
      },
    })

    if (lockResult.count > 0) {
      logger.info('Retroactively locked predictions for completed game', {
        gameId,
        count: lockResult.count,
      })
    }

    // Fetch all locked predictions for this game that haven't been processed
    const predictions = (await prisma.prediction.findMany({
      where: {
        gameId,
        lockedAt: { not: null },
        processedAt: null,
      },
      include: {
        game: {
          include: { result: true },
        },
      },
    })) as unknown as PredictionWithGame[]

    result.totalPredictions = predictions.length

    logger.info('Starting game scoring', {
      gameId,
      totalPredictions: result.totalPredictions,
    })

    // Process each prediction
    for (const prediction of predictions) {
      try {
        await this.scorePrediction(prediction)
        result.scored++
      } catch (error) {
        logger.error('Error scoring prediction', {
          predictionId: prediction.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        result.errors.push(`Prediction ${prediction.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        result.skipped++
      }
    }

    // Mark the game result as scored
    await prisma.result.update({
      where: { gameId },
      data: { scoredAt: new Date() },
    })

    // Calculate total points awarded
    const pointsSum = await prisma.pointsLedger.aggregate({
      where: {
        createdAt: { gte: new Date(Date.now() - 60000) }, // Last minute
        reason: { contains: gameId },
      },
      _sum: { delta: true },
    })

    result.totalPointsAwarded = pointsSum._sum.delta ?? 0

    logger.info('Game scoring completed', {
      ...result,
      gameId,
    })

    return result
  }

  /**
   * Score a single prediction
   *
   * @param prediction - Prediction to score
   */
  private async scorePrediction(prediction: PredictionWithGame): Promise<void> {
    const startTime = Date.now()

    // 1. Determine if prediction is correct
    const isCorrect = pointsService.isPredictionCorrect(prediction)

    // 2. Update prediction with result
    await prisma.prediction.update({
      where: { id: prediction.id },
      data: {
        isCorrect,
        processedAt: new Date(),
      },
    })

    // 3. If incorrect, update streak and exit
    if (!isCorrect) {
      await pointsService.updateUserStreak(prediction.userId, false, prediction.bonusTier)
      logger.debug('Prediction incorrect, no points awarded', {
        predictionId: prediction.id,
        userId: prediction.userId,
      })
      return
    }

    // 4. Get user's current streak and daily prediction count
    const user = await prisma.user.findUnique({
      where: { id: prediction.userId },
      select: { currentStreak: true },
    })

    const currentStreak = user?.currentStreak ?? 0

    // Get daily prediction count at time of prediction
    const dailyCount = await pointsService.getDailyPredictionCount(prediction.userId, prediction.createdAt)

    // 5. Calculate points
    const points = pointsService.calculatePoints(prediction, currentStreak, dailyCount)

    // 6. Award points
    await pointsService.awardPoints(prediction.userId, points, `Correct prediction on game ${prediction.gameId}`, {
      predictionId: prediction.id,
      game: prediction.gameId,
      league: prediction.game.league,
      type: prediction.type,
      pick: prediction.pick,
      bonusTier: prediction.bonusTier,
      streak: currentStreak,
      dailyCount,
    })

    // 7. Update streak
    await pointsService.updateUserStreak(prediction.userId, true, prediction.bonusTier)

    const duration = Date.now() - startTime

    logger.info('Prediction scored', {
      predictionId: prediction.id,
      userId: prediction.userId,
      isCorrect,
      points,
      bonusTier: prediction.bonusTier,
      streak: currentStreak,
      duration: `${duration}ms`,
    })
  }

  /**
   * Score multiple games in batch
   *
   * @param gameIds - Array of game IDs to score
   * @returns Array of scoring results
   */
  async scoreMultipleGames(gameIds: string[]): Promise<GameScoringResult[]> {
    const results: GameScoringResult[] = []

    for (const gameId of gameIds) {
      try {
        const result = await this.scoreCompletedGame(gameId)
        results.push(result)
      } catch (error) {
        logger.error('Error scoring game', {
          gameId,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        results.push({
          gameId,
          totalPredictions: 0,
          scored: 0,
          skipped: 0,
          totalPointsAwarded: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        })
      }
    }

    return results
  }

  /**
   * Find all games that are ready to be scored
   * (have results but haven't been scored yet)
   *
   * @returns Array of game IDs ready to score
   */
  async findGamesReadyToScore(): Promise<string[]> {
    // Find all games with unscored results
    // Use case-insensitive matching for "Final" status or any completed game with a result
    const games = await prisma.game.findMany({
      where: {
        result: {
          scoredAt: null,
        },
        OR: [{ status: { contains: 'final', mode: 'insensitive' } }, { status: { contains: 'Final' } }],
      },
      select: { id: true },
    })

    return games.map((g) => g.id)
  }
}

// Export singleton instance
export const scoreGameService = new ScoreGameService()
