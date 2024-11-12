import { Prediction } from '@/types/point-system'
import { User } from '@/types/user'

const BASE_POINTS = 10
const DAILY_PREDICTION_CAP = 5
const MAX_DAILY_PREDICTIONS = 100

export function calculatePoints(prediction: Prediction, user: User): number {
  let points = BASE_POINTS

  if (prediction.isCorrect) {
    if (user.dailyPredictions < DAILY_PREDICTION_CAP) {
      // Odds-based multiplier
      if (prediction.odds > 0) {
        points += BASE_POINTS * (prediction.odds / 100)
      } else {
        points += BASE_POINTS * (Math.abs(prediction.odds) / 100)
      }

      // Streak-based multiplier
      if (user.streak >= 2) {
        points += BASE_POINTS * user.streak
      }

      // Upset multiplier
      if (prediction.isUpset) {
        points += BASE_POINTS * 2
      }
    }
  }

  return points
}

export function awardPoints(user: User, prediction: Prediction): User {
  if (user.dailyPredictions >= MAX_DAILY_PREDICTIONS) {
    return user
  }

  const points = calculatePoints(prediction, user)

  if (prediction.isCorrect) {
    user.points += points
    user.streak += 1
  } else {
    user.streak = 0
  }

  user.dailyPredictions += 1
  return user
}

export function resetDailyPredictions(user: User): User {
  user.dailyPredictions = 0
  return user
}
