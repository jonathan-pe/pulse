import { Toaster } from '@/components/ui/sonner'
import type { useClerkAuth } from '@/hooks/useClerkAuth'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import type { QueryClient } from '@tanstack/react-query'

// Define the shape of the router context so route loaders / beforeLoad
// can safely access `context.auth` with proper TypeScript types.
export interface PulseRouterContext {
  auth: ReturnType<typeof useClerkAuth>
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<PulseRouterContext>()({
  component: () => (
    <div className='min-h-screen flex flex-col'>
      <Outlet />
      <Toaster richColors />
      <TanStackRouterDevtools position='bottom-right' />
    </div>
  ),
})
