'use client'

import LoginForm from '@/app/login/login-form'
import GoogleOneTap from '../components/google-one-tap'
import { useEffect, useState } from 'react'
import SignupForm from './signup-form'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

export default function LoginPage() {
  const searchParams = useSearchParams()

  const [view, setView] = useState<'login' | 'signup'>('login')

  // check query params for email confirmation
  useEffect(() => {
    const email_confirmed = searchParams.get('email_confirmed')

    if (email_confirmed === 'true') {
      // need timeout to allow toast to render https://sonner.emilkowal.ski/toast#render-toast-on-page-load
      setTimeout(() => {
        toast.success('Email confirmed.', {
          description: 'You can now login.',
          duration: 10000,
        })
      })
    }
  }, [])

  return (
    <div className='flex items-center justify-center min-h-screen'>
      {/* <GoogleOneTap /> */}
      {view === 'login' ? <LoginForm setView={setView} /> : <SignupForm setView={setView} />}
    </div>
  )
}
