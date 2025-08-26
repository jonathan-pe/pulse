import { Button } from '@/components/ui/button'
import { SignedIn, SignedOut, SignOutButton } from '@clerk/clerk-react'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  return (
    <>
      <SignedIn>
        Signed In!
        <SignOutButton>
          <Button variant='outline' className='ml-2'>
            Sign Out
          </Button>
        </SignOutButton>
      </SignedIn>
      <SignedOut>Signed Out!</SignedOut>
    </>
  )
}
