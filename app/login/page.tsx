'use client'

import LoginForm from '@/app/components/login-form'
import GoogleOneTap from '../components/google-one-tap'
import { useState } from 'react'
import SignupForm from '../components/signup-form'

export default function LoginPage() {
  const [view, setView] = useState<'login' | 'signup'>('login')

  return (
    <div className='flex items-center justify-center min-h-screen'>
      <GoogleOneTap />
      {view === 'login' ? <LoginForm setView={setView} /> : <SignupForm setView={setView} />}
    </div>
  )
}
