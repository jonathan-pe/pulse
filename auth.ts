import NextAuth, { NextAuthConfig } from 'next-auth'
import Google from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/prisma'

export const config: NextAuthConfig = {
  providers: [Google],
  adapter: PrismaAdapter(prisma),
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      // Add custom user data to the JWT token
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        // Add any additional data you want here
      }
      return token
    },
    async session({ session, token }) {
      // Merge the JWT data into the session object
      session.user.id = token.id as string
      session.user.email = token.email ?? ''
      session.user.name = token.name
      // You can also add custom fields here if needed
      return session
    },
  },
}

export const { handlers, signIn, signOut, auth } = NextAuth(config)
