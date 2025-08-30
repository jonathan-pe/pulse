import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'

import './index.css'
import { applyInitialTheme } from '@/lib/useTheme'

// Import your Publishable Key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Add your Clerk Publishable Key to the .env file')
}

import AppRouter from '@/components/auth/AppRouter'
import { ClerkWrapper } from '@/auth/clerk'
import { queryClient } from '@/lib/trpc'

// Apply the user's saved theme synchronously so the initial loader matches it
applyInitialTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ClerkWrapper>
        <AppRouter />
      </ClerkWrapper>
    </QueryClientProvider>
  </StrictMode>
)
