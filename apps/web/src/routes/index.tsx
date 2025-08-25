import { SignedIn, SignedOut } from '@clerk/clerk-react'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  return (
    <>
      <SignedIn>Signed In!</SignedIn>
      <SignedOut>Signed Out!</SignedOut>
    </>
  )
}
