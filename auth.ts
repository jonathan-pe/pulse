import NextAuth, { NextAuthConfig } from 'next-auth'
import Google from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/prisma'
import { JWT } from 'next-auth/jwt'
import { SignJWT, jwtVerify, compactDecrypt, CompactEncrypt } from 'jose'

declare module 'next-auth' {
  interface User {
    accessToken?: string
  }

  interface Session {
    accessToken?: string
  }
}

const SECRET_KEY = new TextEncoder().encode(process.env.AUTH_SECRET!)
const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_SECRET!, 'base64')

export const config: NextAuthConfig = {
  providers: [Google],
  adapter: PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  jwt: {
    encode: async ({ token, maxAge }) => {
      const jwtClaims = {
        sub: token?.sub,
        name: token?.name,
        email: token?.email,
        picture: token?.picture,
        jti: token?.jti,
        iat: Date.now() / 1000,
        exp: Math.floor(Date.now() / 1000) + (maxAge ?? 30 * 24 * 60 * 60 * 1000), // 30 days
        accessToken: token?.accessToken,
      }

      let jwt

      if (token?.jti && token?.sub) {
        jwt = await new SignJWT(jwtClaims)
          .setProtectedHeader({ alg: 'HS512' })
          .setIssuedAt()
          .setIssuer('pulse')
          .setAudience('pulse')
          .setExpirationTime('30 days')
          .setJti(token.jti)
          .setSubject(token.sub)
          .sign(SECRET_KEY)
      } else {
        jwt = await new SignJWT(jwtClaims)
          .setProtectedHeader({ alg: 'HS512' })
          .setIssuedAt()
          .setIssuer('pulse')
          .setAudience('pulse')
          .setExpirationTime('30 days')
          .sign(SECRET_KEY)
      }

      const encryptedJWT = await new CompactEncrypt(new TextEncoder().encode(jwt))
        .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
        .encrypt(ENCRYPTION_KEY)

      return encryptedJWT
    },
    decode: async ({ token }) => {
      try {
        const { plaintext } = await compactDecrypt(token!, ENCRYPTION_KEY)
        const decodedJWT = await jwtVerify(new TextDecoder().decode(plaintext), SECRET_KEY, { algorithms: ['HS512'] })
        return decodedJWT.payload as JWT
      } catch (error) {
        console.error(error)
        return null
      }
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }

      return token
    },
    async session({ session, token }) {
      session.user.id = (token.id ?? token.sub) as string

      return session
    },
  },
}

export const { handlers, signIn, signOut, auth } = NextAuth(config)
