import { ClerkProvider, useAuth } from '@clerk/clerk-react'
import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { setGetSessionToken } from '@/lib/trpc'

function AuthTokenProvider({ children }: { children: ReactNode }) {
  const { getToken } = useAuth()

  useEffect(() => {
    // Set up the function to get session tokens for tRPC
    setGetSessionToken(() => getToken())
  }, [getToken])

  return <>{children}</>
}

export function ClerkWrapper({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
      <AuthTokenProvider>{children}</AuthTokenProvider>
    </ClerkProvider>
  )
}
