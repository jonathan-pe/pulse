import React from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { cn } from '../../lib/utils'
import { useLocation } from '@tanstack/react-router'

type Props = {
  email: string
  password: string
  setEmail: (v: string) => void
  setPassword: (v: string) => void
  error: string | null
  loading: boolean
  onSubmit: (e: React.FormEvent) => void
}

export default function CredentialsForm({ email, password, setEmail, setPassword, error, loading, onSubmit }: Props) {
  const location = useLocation()
  const isLogin = location.pathname === '/login'

  return (
    <form onSubmit={onSubmit} className='flex flex-col gap-3'>
      <div className='flex flex-col gap-1'>
        <Label htmlFor='email'>Email</Label>
        <Input
          id='email'
          className={cn('w-full', 'bg-white/80 dark:bg-input')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type='email'
          required
        />
      </div>

      <div className='flex flex-col gap-1'>
        <Label htmlFor='password'>Password</Label>
        <Input
          id='password'
          className='w-full'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type='password'
          required
        />
      </div>

      {error && <div className='text-destructive text-sm'>{error}</div>}

      <div id='clerk-captcha' />

      <Button type='submit' disabled={loading} className='w-full' size='lg'>
        {isLogin ? 'Sign In' : 'Sign Up'}
      </Button>
    </form>
  )
}
