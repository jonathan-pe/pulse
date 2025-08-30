import { ClerkProvider } from '@clerk/clerk-react'
import type { ReactNode } from 'react'

export function ClerkWrapper({ children }: { children: ReactNode }) {
  return <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>{children}</ClerkProvider>
}
