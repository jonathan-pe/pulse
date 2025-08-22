// apps/api/src/trpc.ts
import { initTRPC, TRPCError } from '@trpc/server';
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import type { AuthObject } from '@clerk/express';

export type Context = {
  auth: AuthObject | null;
};

export const createContext = ({ req }: CreateExpressContextOptions): Context => {
  // clerkMiddleware has already parsed auth onto req
  const auth = (req as any).auth as AuthObject | null;
  return { auth };
};

const t = initTRPC.context<Context>().create();

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.auth?.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: { ...ctx, auth: ctx.auth },
  });
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed);
