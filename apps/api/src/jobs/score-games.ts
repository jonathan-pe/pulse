/**
 * Job: Score Completed Games
 *
 * Finds all games with results that haven't been scored yet and processes
 * their predictions, calculating and awarding points to users.
 *
 * This job can be run:
 * - Via CLI: pnpm cli score-games
 * - Via cron: hitting POST /admin/score-all endpoint
 * - Manually: as needed after game results are set
 */

import { scoreGameService } from '../services/score-game.service'
import { createLogger } from '../lib/logger'

const logger = createLogger('ScoreGamesJob')

export interface ScoreGamesJobResult {
  success: boolean
  gamesScored: number
  predictionsScored: number
  pointsAwarded: number
  errors: string[]
  duration: number
}

export async function scoreGamesJob(): Promise<ScoreGamesJobResult> {
  const startTime = Date.now()

  logger.info('Starting score games job')

  try {
    // Find all games ready to score
    const gameIds = await scoreGameService.findGamesReadyToScore()

    if (gameIds.length === 0) {
      logger.info('No games ready to score')
      return {
        success: true,
        gamesScored: 0,
        predictionsScored: 0,
        pointsAwarded: 0,
        errors: [],
        duration: Date.now() - startTime,
      }
    }

    logger.info(`Found ${gameIds.length} games ready to score`, { gameIds })

    // Score all games
    const results = await scoreGameService.scoreMultipleGames(gameIds)

    // Aggregate results
    const summary = {
      success: true,
      gamesScored: results.length,
      predictionsScored: results.reduce((sum, r) => sum + r.scored, 0),
      pointsAwarded: results.reduce((sum, r) => sum + r.totalPointsAwarded, 0),
      errors: results.flatMap((r) => r.errors),
      duration: Date.now() - startTime,
    }

    logger.info('Score games job completed', summary)

    return summary
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.error('Score games job failed', error instanceof Error ? error : undefined)

    return {
      success: false,
      gamesScored: 0,
      predictionsScored: 0,
      pointsAwarded: 0,
      errors: [message],
      duration: Date.now() - startTime,
    }
  }
}
