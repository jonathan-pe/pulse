import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { GoogleOneTap } from '@clerk/clerk-react'
import { Button } from '@/components/ui/button'
import SignUpForm from '@/components/auth/SignUpForm'
import EmailVerificationForm from '@/components/auth/EmailVerificationForm'

// The project's generated route types are available at build-time; cast to any to avoid
// a compile-time type error in the editor environment.
export const Route = createFileRoute('/_unauthenticated/signup')({
  component: SignUp,
})

function SignUp() {
  const navigate = useNavigate({ from: '/' })

  const [verifying, setVerifying] = useState(false)

  // Handle the submission of the verification form

  return (
    <div className='p-4 max-w-md mx-auto'>
      <h2 className='text-2xl mb-4'>Sign Up</h2>
      {verifying ? <EmailVerificationForm setVerifying={setVerifying} /> : <SignUpForm setVerifying={setVerifying} />}
      <Button variant='ghost' onClick={() => navigate({ to: '/login' })} className='w-full mt-2'>
        Already have an account? Log in
      </Button>
      <GoogleOneTap />
    </div>
  )
}
