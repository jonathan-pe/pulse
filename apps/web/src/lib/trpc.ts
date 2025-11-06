import { QueryClient } from '@tanstack/react-query'
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query'
import type { AppRouter } from '@pulse/types'
import superjson from 'superjson'

export const queryClient = new QueryClient()

/**
 * Get the Clerk session token for authenticated requests
 * This is a placeholder that will be replaced by the actual implementation
 */
let getSessionToken: (() => Promise<string | null>) | null = null

export const setGetSessionToken = (fn: () => Promise<string | null>) => {
  getSessionToken = fn
}

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${import.meta.env.VITE_API_BASE_URL}/trpc`,
      transformer: superjson,
      async headers() {
        const token = getSessionToken ? await getSessionToken() : null
        return token
          ? {
              authorization: `Bearer ${token}`,
            }
          : {}
      },
    }),
  ],
})

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
})
