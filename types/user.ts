import { User } from 'next-auth'

export interface UserStats {
  correctPredictions: number
  createdAt: Date
  currentStreak: number
  id: string
  longestStreak: number
  points: number
  totalPredictions: number
  updatedAt: Date
  user: User
  userId: String
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
