import { QueryClient } from '@tanstack/react-query'
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query'
import type { AppRouter } from '@pulse/types'
import superjson from 'superjson'

export const queryClient = new QueryClient()
const trpcClient = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ url: `${import.meta.env.VITE_API_BASE_URL}/trpc`, transformer: superjson })],
})

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
})
