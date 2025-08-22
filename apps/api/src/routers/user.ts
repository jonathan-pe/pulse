// apps/api/src/routers/user.ts
import { protectedProcedure, router } from '../trpc'
import { User, userSchema } from '@pulse/types'

export const userRouter = router({
  me: protectedProcedure.query(({ ctx }) => {
    const user: Partial<User> = {
      id: ctx.userId ?? '',
      // We don't have email/name in this context; keep minimal
    }

    // Return a shape that matches the schema where possible.
    return {
      userId: ctx.userId,
      user: user as User,
    }
  }),
})
