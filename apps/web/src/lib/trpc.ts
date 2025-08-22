// apps/web/src/lib/trpc.ts
import { createTRPCReact } from '@trpc/react-query'
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import type { AppRouter } from '@pulse/api'

export const trpc = createTRPCReact<AppRouter>()

async function getAuthHeader() {
  // ClerkProvider attaches a global "Clerk" object
  const token = await (window as any)?.Clerk?.session?.getToken?.()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: import.meta.env.VITE_API_URL as string,
      async headers() {
        return await getAuthHeader()
      },
      fetch(url, opts) {
        // include credentials if you prefer cookie-based auth later
        return fetch(url, { ...opts, credentials: 'include' })
      },
    }),
  ],
})
