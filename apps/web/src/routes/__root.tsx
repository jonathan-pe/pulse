import { Toaster } from '@/components/ui/sonner'
import ThemeToggle from '@/components/ui/theme-toggle'
import type { useClerkAuth } from '@/hooks/useClerkAuth'
import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

// Define the shape of the router context so route loaders / beforeLoad
// can safely access `context.auth` with proper TypeScript types.
export interface PulseRouterContext {
  auth: ReturnType<typeof useClerkAuth>
}

export const Route = createRootRouteWithContext<PulseRouterContext>()({
  component: () => (
    <>
      <div className='p-2 flex items-center gap-2'>
        <Link to='/' className='[&.active]:font-bold'>
          Home
        </Link>{' '}
        <Link to='/about' className='[&.active]:font-bold'>
          About
        </Link>
        <Link to='/login' className='[&.active]:font-bold'>
          Login
        </Link>
        <div className='ml-auto'>
          <ThemeToggle />
        </div>
      </div>
      <hr />
      <Outlet />
      <Toaster richColors />
      <TanStackRouterDevtools />
    </>
  ),
})
