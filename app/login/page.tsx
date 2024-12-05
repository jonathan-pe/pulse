'use client'

import LoginForm from '@/app/login/login-form'
import { useEffect } from 'react'

import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

export default function LoginPage() {
  const searchParams = useSearchParams()

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
  }, [searchParams])

  return (
    <div className='flex min-h-screen items-center justify-center'>
      <LoginForm />
    </div>
  )
}
