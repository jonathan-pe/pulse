import { useClerkAuth } from '@/hooks/useClerkAuth'

// Import the generated route tree
import { routeTree } from '@/routeTree.gen'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { LoaderCircle } from 'lucide-react'

// Create a new router instance
const router = createRouter({
  routeTree,
  // auth will initially be undefined
  // We'll be passing down the auth state from within a React component
  context: { auth: undefined! },
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const AppRouter = () => {
  const auth = useClerkAuth()

  if (auth.isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <LoaderCircle className='animate-spin' />
      </div>
    )
  }

  return <RouterProvider router={router} context={{ auth }} />
}

export default AppRouter
