import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './index.css'

// Import your Publishable Key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Add your Clerk Publishable Key to the .env file')
}

import AppRouter from '@/components/auth/AppRouter'
import { ClerkWrapper } from '@/auth/clerk'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkWrapper>
      <AppRouter />
    </ClerkWrapper>
  </StrictMode>
)
