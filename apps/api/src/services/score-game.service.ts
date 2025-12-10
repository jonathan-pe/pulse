import { prisma } from '@/lib/db'
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

    // 2. Get user's current streak and daily prediction count
    const user = await prisma.user.findUnique({
      where: { id: prediction.userId },
      select: { currentStreak: true },
    })

    const currentStreak = user?.currentStreak ?? 0

    // Get daily prediction count at time of prediction
    const dailyCount = await pointsService.getDailyPredictionCount(prediction.userId, prediction.createdAt)

    // 3. Calculate points (handles both correct and incorrect predictions)
    const points = pointsService.calculatePoints(prediction, dailyCount, isCorrect)

    // 4. Update prediction with result and points
    await prisma.prediction.update({
      where: { id: prediction.id },
      data: {
        isCorrect,
        points, // Can now be negative
        processedAt: new Date(),
      },
    })

    // 5. Award or deduct points
    const pointsReason = isCorrect
      ? `Correct prediction on game ${prediction.gameId}`
      : `Incorrect prediction on game ${prediction.gameId}`

    await pointsService.awardPoints(prediction.userId, points, pointsReason, {
      predictionId: prediction.id,
      gameId: prediction.gameId,
      league: prediction.game.league,
      type: prediction.type,
      pick: prediction.pick,
      bonusTier: prediction.bonusTier,
      isCorrect,
      streak: currentStreak, // Tracked for achievements, not used in points
      dailyCount,
    })

    // 6. Update streak (cosmetic tracking for achievements)
    await pointsService.updateUserStreak(prediction.userId, isCorrect, prediction.bonusTier)

    // 7. Check and unlock achievements (only for correct predictions)
    if (isCorrect) {
      const { achievementsService } = await import('./achievements.service.js')
      const newAchievements = await achievementsService.checkAndUnlockAchievements(prediction.userId)

      if (newAchievements.length > 0) {
        logger.info('New achievements unlocked', {
          userId: prediction.userId,
          count: newAchievements.length,
          achievementIds: newAchievements,
        })
      }
    }

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

  /**
   * Find predictions that were created after their game was scored
   * This is a safety net for race conditions where predictions slip through validation
   *
   * @returns Array of prediction IDs that need to be scored
   */
  async findUnscoredPredictionsOnFinishedGames(): Promise<string[]> {
    // Find predictions where:
    // 1. isCorrect is null (not yet scored)
    // 2. Game has a result (game was already scored)
    // 3. Game status indicates finished (Final)
    const predictions = await prisma.prediction.findMany({
      where: {
        isCorrect: null,
        processedAt: null,
        game: {
          result: {
            isNot: null,
          },
          status: 'Final',
        },
      },
      select: { id: true },
    })

    return predictions.map((p) => p.id)
  }

  /**
   * Score a single prediction that was missed during normal scoring
   * This is for predictions created after their game was already scored
   *
   * @param predictionId - The prediction ID to score
   * @returns Scoring result
   */
  async scoreMissedPrediction(
    predictionId: string
  ): Promise<{ scored: boolean; pointsAwarded: number; error?: string }> {
    try {
      const prediction = await prisma.prediction.findUnique({
        where: { id: predictionId },
        include: {
          game: {
            include: { result: true },
          },
        },
      })

      if (!prediction) {
        return { scored: false, pointsAwarded: 0, error: 'Prediction not found' }
      }

      if (!prediction.game.result) {
        return { scored: false, pointsAwarded: 0, error: 'Game has no result' }
      }

      if (prediction.isCorrect !== null) {
        return { scored: false, pointsAwarded: 0, error: 'Prediction already scored' }
      }

      // Lock the prediction if not already locked
      if (!prediction.lockedAt) {
        await prisma.prediction.update({
          where: { id: predictionId },
          data: { lockedAt: new Date() },
        })
      }

      // Prepare prediction data for scoring
      const predictionWithGame = {
        id: prediction.id,
        userId: prediction.userId,
        gameId: prediction.gameId,
        type: prediction.type,
        pick: prediction.pick,
        oddsAtPrediction: prediction.oddsAtPrediction as Parameters<
          typeof pointsService.isPredictionCorrect
        >[0]['oddsAtPrediction'],
        bonusTier: prediction.bonusTier,
        isCorrect: prediction.isCorrect,
        createdAt: prediction.createdAt,
        game: {
          league: prediction.game.league,
          result: {
            homeScore: prediction.game.result.homeScore,
            awayScore: prediction.game.result.awayScore,
          },
        },
      }

      // Determine if prediction is correct
      const isCorrect = pointsService.isPredictionCorrect(predictionWithGame)

      // Update prediction with result
      await prisma.prediction.update({
        where: { id: predictionId },
        data: {
          isCorrect,
          processedAt: new Date(),
        },
      })

      // Update streak
      await pointsService.updateUserStreak(prediction.userId, isCorrect, prediction.bonusTier)

      let pointsAwarded = 0

      // If correct, award points
      if (isCorrect) {
        const dailyCount = await pointsService.getDailyPredictionCount(prediction.userId, prediction.createdAt)
        pointsAwarded = pointsService.calculatePoints(predictionWithGame, dailyCount)

        await pointsService.awardPoints(
          prediction.userId,
          pointsAwarded,
          `Correct prediction on game ${prediction.gameId}`,
          {
            predictionId: prediction.id,
            gameId: prediction.gameId,
            league: prediction.game.league,
            type: prediction.type,
            pick: prediction.pick,
            bonusTier: prediction.bonusTier,
            dailyCount,
            lateScoring: true, // Flag to indicate this was scored after initial game scoring
          }
        )

        // Check achievements
        const { achievementsService } = await import('./achievements.service.js')
        await achievementsService.checkAndUnlockAchievements(prediction.userId)
      }

      logger.info('Scored missed prediction', {
        predictionId,
        isCorrect,
        pointsAwarded,
      })

      return { scored: true, pointsAwarded }
    } catch (error) {
      logger.error('Error scoring missed prediction', error instanceof Error ? error : undefined, {
        predictionId,
      })
      return {
        scored: false,
        pointsAwarded: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Score all predictions that were missed during normal scoring
   * This should be run periodically as a safety net
   *
   * @returns Summary of scored predictions
   */
  async scoreMissedPredictions(): Promise<{ total: number; scored: number; errors: number; pointsAwarded: number }> {
    const predictionIds = await this.findUnscoredPredictionsOnFinishedGames()

    if (predictionIds.length === 0) {
      logger.debug('No missed predictions found')
      return { total: 0, scored: 0, errors: 0, pointsAwarded: 0 }
    }

    logger.info('Found missed predictions to score', { count: predictionIds.length })

    let scored = 0
    let errors = 0
    let totalPoints = 0

    for (const predictionId of predictionIds) {
      const result = await this.scoreMissedPrediction(predictionId)
      if (result.scored) {
        scored++
        totalPoints += result.pointsAwarded
      } else {
        errors++
      }
    }

    logger.info('Scored missed predictions', {
      total: predictionIds.length,
      scored,
      errors,
      pointsAwarded: totalPoints,
    })

    return {
      total: predictionIds.length,
      scored,
      errors,
      pointsAwarded: totalPoints,
    }
  }
}

// Export singleton instance
export const scoreGameService = new ScoreGameService()
