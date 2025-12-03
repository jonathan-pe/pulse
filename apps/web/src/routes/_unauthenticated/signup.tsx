import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { GoogleOneTap, useSignUp } from '@clerk/clerk-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import SignUpForm from '@/components/auth/SignUpForm'
import EmailVerificationForm from '@/components/auth/EmailVerificationForm'
import OAuthButton from '@/components/auth/OAuthButton'
import type { OAuthStrategy } from '@clerk/types'
import { toast } from 'sonner'

export const Route = createFileRoute('/_unauthenticated/signup')({
  component: SignUp,
})

function SignUp() {
  const navigate = useNavigate({ from: '/' })
  const { signUp, isLoaded } = useSignUp()

  const [verifying, setVerifying] = useState(false)
  const [loading, setLoading] = useState(false)

  async function signUpWithOAuth(strategy: OAuthStrategy) {
    setLoading(true)

    if (!isLoaded) {
      setLoading(false)
      return
    }

    try {
      await signUp.authenticateWithRedirect({
        strategy,
        redirectUrl: '/login/sso-callback',
        redirectUrlComplete: '/',
      })
    } catch (err: unknown) {
      // Suppress console error; handle via UI feedback if needed
      toast.error('Error signing up with OAuth. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <CardTitle className='text-2xl'>{verifying ? 'Verify your email' : 'Create an account'}</CardTitle>
          <CardDescription>
            {verifying ? 'Enter the verification code sent to your email' : 'Get started with Pulse today'}
          </CardDescription>
        </CardHeader>

        <CardContent className='flex flex-col gap-6'>
          {verifying ? (
            <EmailVerificationForm setVerifying={setVerifying} />
          ) : (
            <>
              <SignUpForm setVerifying={setVerifying} />

              <div className='relative'>
                <div className='absolute inset-0 flex items-center'>
                  <Separator className='w-full' />
                </div>
                <div className='relative flex justify-center text-xs uppercase'>
                  <span className='bg-card px-2 text-muted-foreground'>Or continue with</span>
                </div>
              </div>

              <OAuthButton onClick={() => signUpWithOAuth('oauth_google')} disabled={!isLoaded || loading}>
                <img src='/Google_G_logo.svg' alt='' className='w-5 h-5' />
                <span>Continue with Google</span>
              </OAuthButton>
            </>
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
