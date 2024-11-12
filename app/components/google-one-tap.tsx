'use client'

import Script from 'next/script'
import { createClient } from '@/utils/supabase/client'
import { CredentialResponse } from 'google-one-tap'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

const OneTapComponent = () => {
  const supabase = createClient()
  const router = useRouter()
  const initializedRef = useRef(false)

  // generate nonce to use for google id token sign-in
  const generateNonce = async (): Promise<string[]> => {
    const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
    const encoder = new TextEncoder()
    const encodedNonce = encoder.encode(nonce)
    const hashBuffer = await crypto.subtle.digest('SHA-256', encodedNonce)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashedNonce = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

    return [nonce, hashedNonce]
  }

  useEffect(() => {
    const initializeGoogleOneTap = async () => {
      if (initializedRef.current) return
      initializedRef.current = true

      console.log('Initializing Google One Tap')
      const [nonce, hashedNonce] = await generateNonce()
      console.log('Nonce: ', nonce, hashedNonce)

      // check if there's already an existing session before initializing the one-tap UI
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        console.error('Error getting session', error)
      }
      if (data.session) {
        router.push('/')
        return
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      /* global google */
      window.google.accounts.id.initialize({
        client_id: process.env.AUTH_GOOGLE_ID!,
        callback: async (response: CredentialResponse) => {
          try {
            // send id token returned in response.credential to supabase
            const { data, error } = await supabase.auth.signInWithIdToken({
              provider: 'google',
              token: response.credential,
              nonce,
            })

            if (error) throw error
            console.log('Session data: ', data)
            console.log('Successfully logged in with Google One Tap')
            router.push('/')
          } catch (error) {
            console.error('Error during Google One Tap sign-in', error)
          }
        },
        nonce: hashedNonce,
        use_fedcm_for_prompt: true,
        cancel_on_tap_outside: false,
        log_level: 'debug',
      })
      window.google.accounts.id.prompt()
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = initializeGoogleOneTap
    document.body.appendChild(script)

    return () => {
      initializedRef.current = false
      document.body.removeChild(script)
    }
  }, [router])

  return (
    <>
      <Script src='https://accounts.google.com/gsi/client' strategy='afterInteractive' />
      <div id='oneTap' className='fixed top-0 right-0 z-[100]' />
    </>
  )
}

export default OneTapComponent
