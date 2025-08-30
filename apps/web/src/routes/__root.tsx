import { Toaster } from '@/components/ui/sonner'
import type { useClerkAuth } from '@/hooks/useClerkAuth'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import Navbar from '@/components/NavBar'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import type { TRPCOptionsProxy } from '@trpc/tanstack-react-query'
import type { AppRouter } from '@pulse/types'
import type { QueryClient } from '@tanstack/react-query'

// Define the shape of the router context so route loaders / beforeLoad
// can safely access `context.auth` with proper TypeScript types.
export interface PulseRouterContext {
  auth: ReturnType<typeof useClerkAuth>
  trpc: TRPCOptionsProxy<AppRouter>
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<PulseRouterContext>()({
  component: () => (
    <div className='min-h-screen mx-auto'>
      <Navbar />
      <Outlet />
      <Toaster richColors />
      <TanStackRouterDevtools />
    </div>
  ),
})
