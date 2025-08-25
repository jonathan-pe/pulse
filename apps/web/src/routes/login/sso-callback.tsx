import { useClerk } from '@clerk/clerk-react'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/login/sso-callback')({
  component: RouteComponent,
})

function RouteComponent() {
  const { handleRedirectCallback } = useClerk()

  useEffect(() => {
    handleRedirectCallback({
      signInForceRedirectUrl: import.meta.env.VITE_CLERK_SIGN_IN_FORCE_REDIRECT_URL || '/',
      signUpForceRedirectUrl: import.meta.env.VITE_CLERK_SIGN_UP_FORCE_REDIRECT_URL || '/',
    })
  }, [handleRedirectCallback])

  // Don't need to return anything. Just need to call the callback
  return null
}
