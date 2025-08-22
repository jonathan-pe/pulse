// apps/web/src/pages/Home.tsx
import { SignedIn, SignedOut } from '@clerk/clerk-react'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Welcome to Pulse</h1>
      <p className="opacity-80">
        This is a minimal starter using Vite + React + Tailwind + tRPC + Clerk. Add shadcn/ui when you're ready.
      </p>
      <SignedOut>
        <p className="opacity-80">Sign in to access your dashboard.</p>
      </SignedOut>
      <SignedIn>
        <p className="opacity-80">You're signed in. Head to your dashboard.</p>
      </SignedIn>
      <Button onClick={() => alert('Hello from a placeholder UI button!')}>Test Button</Button>
    </div>
  )
}
