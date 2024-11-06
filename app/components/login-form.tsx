import Link from 'next/link'

import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { login, signup } from '@/app/actions'

export function LoginForm() {
  return (
    <Card className='mx-auto max-w-sm'>
      <CardHeader>
        <CardTitle className='text-2xl'>Login</CardTitle>
        <CardDescription>Enter your email below to login to your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form className='grid gap-4'>
          <div className='grid gap-2'>
            <Label htmlFor='email'>Email</Label>
            <Input id='email' type='email' name='email' placeholder='m@example.com' required />
          </div>
          <div className='grid gap-2'>
            <div className='flex items-center'>
              <Label htmlFor='password'>Password</Label>
              <Link href='#' className='ml-auto inline-block text-sm underline'>
                Forgot your password?
              </Link>
            </div>
            <Input id='password' type='password' name='password' placeholder='Password' required />
          </div>
          <Button type='submit' className='w-full' formAction={login}>
            Login
          </Button>
          <Button variant='outline' className='w-full'>
            Login with Google
          </Button>
        </form>
        <div className='mt-4 text-center text-sm'>
          Don&apos;t have an account?{' '}
          <Link href='#' className='underline'>
            Sign up
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
