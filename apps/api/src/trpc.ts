import { initTRPC, TRPCError } from '@trpc/server'
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express'
import { getAuth } from '@clerk/express'
import type { AuthObject } from '@clerk/express'

export type Context = {
  auth: AuthObject | null
  userId?: string | null
}

export const createContext = ({ req }: CreateExpressContextOptions): Context => {
  const auth = getAuth(req)

  return { auth, userId: auth.userId }
}

const t = initTRPC.context<Context>().create()

const isAuthed = t.middleware(({ ctx, next }) => {
  // `userId` is extracted in `createContext` so the middleware is a simple
  // presence check. This keeps the middleware tiny and easy to reason about.
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({ ctx })
})

export const router = t.router
export const publicProcedure = t.procedure
export const protectedProcedure = t.procedure.use(isAuthed)
