import { useClerk } from '@clerk/clerk-react'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'

export const Route = createFileRoute('/_unauthenticated/signup/sso-callback')({
  component: SignUpSSOCallback,
})

/**
 * SSO Callback page for OAuth sign-up flows.
 *
 * Uses Clerk.handleRedirectCallback() to process OAuth redirects with custom URLs.
 *
 * @see https://clerk.com/docs/reference/javascript/clerk#handle-redirect-callback
 */
function SignUpSSOCallback() {
  const { handleRedirectCallback } = useClerk()
  const processedRef = useRef(false)

  useEffect(() => {
    if (processedRef.current) return
    processedRef.current = true

    handleRedirectCallback({
      signInUrl: '/login',
      signUpUrl: '/signup',
      signInForceRedirectUrl: '/',
      signUpForceRedirectUrl: '/',
      continueSignUpUrl: '/login/continue',
    })
  }, [handleRedirectCallback])

  return (
    <div className='min-h-screen flex items-center justify-center'>
      <div className='text-muted-foreground'>Completing sign up...</div>
      {/* Required for Clerk's bot sign-up protection */}
      <div id='clerk-captcha' />
    </div>
  )
}
