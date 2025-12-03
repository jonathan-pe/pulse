import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useSignIn, GoogleOneTap } from '@clerk/clerk-react'
import OAuthButton from '@/components/auth/OAuthButton'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { OAuthStrategy } from '@clerk/types'
import LoginForm from '@/components/auth/LoginForm'
import { toast } from 'sonner'

export const Route = createFileRoute('/_unauthenticated/login/')({
  component: Login,
})

function Login() {
  const navigate = useNavigate({ from: '/' })
  const { signIn, isLoaded } = useSignIn()

  const [loading, setLoading] = useState(false)

  async function signInWithOAuth(strategy: OAuthStrategy) {
    setLoading(true)

    if (!isLoaded) {
      setLoading(false)
      return
    }

    try {
      // Request an OAuth sign-in with Google. Clerk requires a redirectUrl when using OAuth.
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: '/login/sso-callback',
        redirectUrlComplete: '/',
      })
    } catch (err: unknown) {
      // Suppress console error; handle via UI feedback if needed
      toast.error('Error signing in with OAuth. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <CardTitle className='text-2xl'>Welcome back</CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>

        <CardContent className='flex flex-col gap-6'>
          <LoginForm loading={loading} setLoading={setLoading} />

          <div className='relative'>
            <div className='absolute inset-0 flex items-center'>
              <Separator className='w-full' />
            </div>
            <div className='relative flex justify-center text-xs uppercase'>
              <span className='bg-card px-2 text-muted-foreground'>Or continue with</span>
            </div>
          </div>

          <OAuthButton onClick={() => signInWithOAuth('oauth_google')} disabled={!isLoaded || loading}>
            <img src='/Google_G_logo.svg' alt='' className='w-5 h-5' />
            <span>Continue with Google</span>
          </OAuthButton>
        </CardContent>

        <CardFooter className='flex justify-center'>
          <p className='text-sm text-muted-foreground'>
            Don't have an account?{' '}
            <Button variant='link' className='p-0 h-auto' onClick={() => navigate({ to: '/signup' })}>
              Sign up
            </Button>
          </p>
        </CardFooter>
      </Card>

      <GoogleOneTap />
    </div>
  )
}
