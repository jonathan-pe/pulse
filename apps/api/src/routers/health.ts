// apps/api/src/routers/health.ts
import { publicProcedure, router } from '../trpc';

export const healthRouter = router({
  ping: publicProcedure.query(() => ({ pong: true })),
});
