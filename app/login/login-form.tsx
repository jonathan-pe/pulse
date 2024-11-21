'use client'

import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { signIn } from 'next-auth/react'
import GoogleIcon from '../components/google-icon'

export default function LoginForm({ setView }: { setView: (view: 'login' | 'signup') => void }) {
  return (
    <Card className='mx-auto w-96'>
      <CardHeader>
        <CardTitle className='text-2xl'>Login</CardTitle>
      </CardHeader>
      <CardContent>
        <Button className='w-full' variant='secondary' onClick={() => signIn('google', { redirectTo: '/sportsbook' })}>
          <GoogleIcon />
          Sign in with Google
        </Button>
      </CardContent>
    </Card>
  )
}
