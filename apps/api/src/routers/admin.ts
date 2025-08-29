import { router, publicProcedure } from '../trpc'
import { z } from 'zod'
import { ingestNatStat } from '../jobs/ingest-natstat'

const ADMIN_API_KEY = process.env.ADMIN_API_KEY ?? ''

const ingestInput = z.object({
  date: z.string().optional(),
  league: z.string().optional(),
  apiKey: z.string().optional(),
})

export const adminRouter = router({
  ingestNatstat: publicProcedure.input(ingestInput).mutation(async ({ input }) => {
    if (ADMIN_API_KEY && input.apiKey !== ADMIN_API_KEY) {
      throw new Error('unauthorized')
    }

    const res = await ingestNatStat({ date: input.date, league: input.league })
    return res
  }),
})
