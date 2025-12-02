import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { GoogleOneTap } from '@clerk/clerk-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
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
    <div className='min-h-screen flex items-center justify-center p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <CardTitle className='text-2xl'>{verifying ? 'Verify your email' : 'Create an account'}</CardTitle>
          <CardDescription>
            {verifying ? 'Enter the verification code sent to your email' : 'Get started with Pulse today'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {verifying ? (
            <EmailVerificationForm setVerifying={setVerifying} />
          ) : (
            <SignUpForm setVerifying={setVerifying} />
          )}
        </CardContent>

        <CardFooter className='flex justify-center'>
          <p className='text-sm text-muted-foreground'>
            Already have an account?{' '}
            <Button variant='link' className='p-0 h-auto' onClick={() => navigate({ to: '/login' })}>
              Log in
            </Button>
          </p>
        </CardFooter>
      </Card>

      <GoogleOneTap />
    </div>
  )
}
