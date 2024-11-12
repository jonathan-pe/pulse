'use client'

import Link from 'next/link'

import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { login } from '@/app/actions'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { LoaderCircle } from 'lucide-react'
import { PasswordInput } from '@/app/components/ui/password-input'

export default function LoginForm({ setView }: { setView: (view: 'login' | 'signup') => void }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    const result = await login(formData)

    setLoading(false)

    if (result?.error) {
      toast.error(result.error.message, {
        description: 'Please try again',
        duration: 5000,
      })
    } else {
      router.push('/sportsbook')
    }
  }

  return (
    <Card className='mx-auto w-96'>
      <CardHeader>
        <CardTitle className='text-2xl'>Login</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className='grid gap-4'>
          <div className='grid gap-2'>
            <Label htmlFor='email'>Email</Label>
            <Input id='email' type='email' name='email' required />
          </div>
          <div className='grid gap-2'>
            <div className='flex items-center'>
              <Label htmlFor='password'>Password</Label>
              {/* <Link href='#' className='ml-auto inline-block text-sm underline'>
                Forgot your password?
              </Link> */}
            </div>
            <PasswordInput id='password' name='password' required />
          </div>
          <Button type='submit' className='w-full'>
            {loading ? <LoaderCircle className='animate-spin' /> : 'Login'}
          </Button>
        </form>
        <div className='mt-4 text-center text-sm'>
          Don&apos;t have an account?{' '}
          <Link href='#' className='underline' onClick={() => setView('signup')}>
            Sign up
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
