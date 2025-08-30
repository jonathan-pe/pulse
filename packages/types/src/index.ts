import { z } from 'zod'
import type { AppRouter } from '@pulse/api'

export const userSchema = z.object({
  id: z.string(),
  email: z.email(),
  name: z.string().nullable().optional(),
})

export type User = z.infer<typeof userSchema>

export const typesVersion = 1 as const

export type { AppRouter }
