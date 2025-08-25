import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useSignIn, useAuth, GoogleOneTap } from '@clerk/clerk-react'
import CredentialsForm from '../../components/auth/CredentialsForm'
import OAuthButton from '../../components/auth/OAuthButton'
import { Button } from '../../components/ui/button'
import type { OAuthStrategy } from '@clerk/types'

// The project's generated route types are available at build-time; cast to any to avoid
// a compile-time type error in the editor environment.
export const Route = createFileRoute('/login/')({
  component: Login,
})

function Login() {
  const navigate = useNavigate({ from: '/' })
  const { signIn, isLoaded, setActive } = useSignIn()
  const auth = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!isLoaded) {
      setError('Auth not ready; try again shortly')
      setLoading(false)
      return
    }

    try {
      const signInAttempt = await signIn.create({
        identifier: email,
        password,
      })

      // If sign-in process is complete, set the created session as active
      // and redirect the user
      if (signInAttempt.status === 'complete') {
        await setActive({
          session: signInAttempt.createdSessionId,
          navigate: async ({ session }) => {
            if (session?.currentTask) {
              // Check for tasks and navigate to custom UI to help users resolve them
              // See https://clerk.com/docs/custom-flows/overview#session-tasks
              console.log(session?.currentTask)
              return
            }

            navigate({ to: '/' })
          },
        })
      } else {
        // If the status is not complete, check why. User may need to
        // complete further steps.
        console.error(JSON.stringify(signInAttempt, null, 2))
      }
    } catch (err: unknown) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2))
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  async function signInWithOAuth(strategy: OAuthStrategy) {
    setError(null)
    setLoading(true)

    if (!isLoaded) {
      setError('Auth not ready; try again shortly')
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
      let msg = String(err)
      if (err && typeof err === 'object' && 'message' in err) {
        msg = (err as { message?: string }).message ?? msg
      }
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='p-4 max-w-md mx-auto'>
      <h2 className='text-2xl mb-4'>Sign in</h2>
      <CredentialsForm
        email={email}
        password={password}
        setEmail={setEmail}
        setPassword={setPassword}
        error={error}
        loading={loading}
        onSubmit={handleSubmit}
      />

      <div className='mt-4 flex flex-col gap-2'>
        <OAuthButton onClick={() => signInWithOAuth('oauth_google')} disabled={!auth.isLoaded || loading}>
          <img src='/Google_G_logo.svg' alt='' className='w-5 h-5' />
          <span>Sign in with Google</span>
        </OAuthButton>

        <Button variant='ghost' size='sm' onClick={() => navigate({ to: '/about' })}>
          Need help? Forgot password
        </Button>
        <Button variant='link' size='sm' onClick={() => navigate({ to: '/signup' })}>
          Sign up
        </Button>
      </div>

      <GoogleOneTap />
    </div>
  )
}
