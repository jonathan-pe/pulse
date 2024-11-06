import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { SupabaseAdapter } from '@auth/supabase-adapter'

if (!process.env.SUPABASE_URL) {
  throw new Error('The SUPABASE_URL environment variable is required')
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('The SUPABASE_SERVICE_ROLE_KEY environment variable is required')
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  adapter: SupabaseAdapter({
    url: process.env.SUPABASE_URL,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY,
  }),
})
