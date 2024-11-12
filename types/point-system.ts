export interface Prediction {
  id: string
  userId: string
  gameId: string
  prediction: string
  isCorrect: boolean
  isUpset: boolean
  odds: number
  timestamp: string
}
