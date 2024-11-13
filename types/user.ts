export interface UserStats {
  points: number
  streak: number
  daily_prediction_count: number
  total_predictions: number
  correct_predictions: number
  bonus_points: number
  last_prediction_date: string | null
}

export interface SignupSchema {
  username: string
  email: string
  password: string
  confirmPassword: string
  captchaToken: string
}

export interface LoginSchema {
  email: string
  password: string
}
