// apps/api/src/routers/user.ts
import { protectedProcedure, router } from '../trpc';

export const userRouter = router({
  me: protectedProcedure.query(({ ctx }) => {
    return {
      userId: ctx.auth?.userId,
    };
  }),
});
