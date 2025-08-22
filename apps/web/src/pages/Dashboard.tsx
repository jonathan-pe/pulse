// apps/web/src/pages/Dashboard.tsx
import { useEffect } from 'react'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import { trpc } from '@/lib/trpc'

export default function Dashboard() {
  return (
    <>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>

      <SignedIn>
        <DashboardInner />
      </SignedIn>
    </>
  )
}

function DashboardInner() {
  const q = trpc.user.me.useQuery()

  useEffect(() => {
    if (q.error) {
      console.error('tRPC error:', q.error)
    }
  }, [q.error])

  if (q.isLoading) return <div>Loading…</div>
  if (q.error) return <div className="text-red-400">Error: {q.error.message}</div>

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <pre className="text-sm opacity-90">userId: {q.data?.userId}</pre>
    </div>
  )
}
