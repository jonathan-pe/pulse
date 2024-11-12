export interface User {
  id: string
  name: string
  points: number
  dailyPredictions: number
  streak: number
}

export interface SignupSchema {
  username: string
  email: string
  password: string
  confirmPassword: string
  captchaToken: string
}
