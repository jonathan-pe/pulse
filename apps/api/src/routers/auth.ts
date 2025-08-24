// import { User } from '@pulse/types'
import { protectedProcedure, router } from '../trpc'
import { User } from '@pulse/types'

export const authRouter = router({
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
