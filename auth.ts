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

      const jwt = await new SignJWT(jwtClaims)
        .setProtectedHeader({ alg: 'HS512' })
        .setIssuedAt()
        .setIssuer('pulse')
        .setAudience('pulse')
        .setExpirationTime('30 days')
        .setJti(token?.jti!)
        .setIssuedAt(new Date())
        .setSubject(token?.sub!)
        .sign(SECRET_KEY)

      const encryptedJWT = await new CompactEncrypt(new TextEncoder().encode(jwt))
        .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
        .encrypt(ENCRYPTION_KEY)

      console.log('encoded & encrypted', encryptedJWT)

      return encryptedJWT
    },
    decode: async ({ token }) => {
      try {
        const { plaintext } = await compactDecrypt(token!, ENCRYPTION_KEY)
        const decodedJWT = await jwtVerify(new TextDecoder().decode(plaintext), SECRET_KEY, { algorithms: ['HS512'] })
        console.log('decoded', decodedJWT.payload)
        return decodedJWT.payload as JWT
      } catch (error) {
        console.error(error)
        return null
      }
    },
  },
  callbacks: {
    async jwt({ token, user, account, session }) {
      // Add custom user data to the JWT token
      console.log(account?.access_token)
      return { ...token, accessToken: user?.accessToken }
    },
    async session({ session, token }) {
      // Merge the JWT data into the session object
      // session.user.id = token.id as string
      // session.user.email = token.email ?? ''
      // session.user.name = token.name
      // session.user.accessToken = token.accessToken as string | undefined
      session.user.accessToken = token.accessToken as string | undefined
      // You can also add custom fields here if needed
      return session
    },
  },
}

export const { handlers, signIn, signOut, auth } = NextAuth(config)
