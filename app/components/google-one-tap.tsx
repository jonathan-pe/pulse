'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { CredentialResponse } from 'google-one-tap'

const supabase = createClient(process.env.SUPABASE_PUBLIC_URL!, process.env.SUPABASE_PUBLIC_ANON_KEY!)

const GoogleOneTap = () => {
  const router = useRouter()

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

      /* global google */
      window.google.accounts.id.initialize({
        client_id: process.env.AUTH_GOOGLE_ID!,
        callback: async (response: CredentialResponse) => {
          try {
            // send id token returned in response.credential to supabase
            const { data, error } = await supabase.auth.signInWithIdToken({
              provider: 'google',
              token: response.credential,
              // nonce,
            })

            if (error) throw error
            console.log('Session data: ', data)
            console.log('Successfully logged in with Google One Tap')
            router.push('/')
          } catch (error) {
            console.error('Error during Google One Tap sign-in', error)
          }
        },
      })
      window.google.accounts.id.prompt()
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = initializeGoogleOneTap
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [router])

  return null
}

export default GoogleOneTap
