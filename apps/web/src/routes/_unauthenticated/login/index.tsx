import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useSignIn, GoogleOneTap } from '@clerk/clerk-react'
import OAuthButton from '@/routes/_unauthenticated/-components/auth/OAuthButton'
import { Button } from '@/components/ui/button'
import type { OAuthStrategy } from '@clerk/types'
import LoginForm from '@/routes/_unauthenticated/-components/auth/LoginForm'
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
      console.error(JSON.stringify(err, null, 2))
      toast.error('Error signing in with OAuth. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='p-4 max-w-md mx-auto'>
      <h2 className='text-2xl mb-4'>Log In</h2>
      <LoginForm loading={loading} setLoading={setLoading} />

      <div className='mt-4 flex flex-col gap-2'>
        <OAuthButton onClick={() => signInWithOAuth('oauth_google')} disabled={!isLoaded || loading}>
          <img src='/Google_G_logo.svg' alt='' className='w-5 h-5' />
          <span>Log in with Google</span>
        </OAuthButton>

        <Button variant='link' size='sm' onClick={() => navigate({ to: '/signup' })}>
          Sign up
        </Button>
      </div>

      <GoogleOneTap />
    </div>
  )
}
