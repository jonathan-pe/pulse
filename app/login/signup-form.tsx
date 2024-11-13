'use client'

import Link from 'next/link'
import HCaptcha from '@hcaptcha/react-hcaptcha'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { LoaderCircle } from 'lucide-react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Input } from '@/app/components/ui/input'
import { PasswordInput } from '../components/ui/password-input'
import { useTheme } from 'next-themes'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../components/ui/form'
import { SignupSchema } from '@/types/user'
import { fetcher } from '@/utils/clientFetcher'

const signupSchema = z
  .object({
    username: z.string(),
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string(),
    captchaToken: z.string(),
  })
  .superRefine(({ password, confirmPassword }, ctx) => {
    if (confirmPassword !== password) {
      ctx.addIssue({
        code: 'custom',
        message: 'The passwords do not match',
        path: ['confirmPassword'],
      })
    }
  })

export default function SignupForm({ setView }: { setView: (view: 'login' | 'signup') => void }) {
  const { theme } = useTheme()

  const [loading, setLoading] = useState(false)
  const captchaRef = useRef<HCaptcha | null>(null)
  const form = useForm<SignupSchema>({
    resolver: zodResolver(signupSchema),
  })

  const handleSubmit = async (values: SignupSchema) => {
    setLoading(true)

    try {
      const { user } = await fetcher(`${process.env.BACKEND_URL}/auth/signup`, {
        method: 'POST',
        body: JSON.stringify(values),
      })

      if (user) {
        toast.success('Account created successfully', {
          description: 'Please check your email to verify your account',
          duration: 10000,
        })
        setView('login')
      } else {
        toast.error('Failed to create account', {
          description: 'Please try again',
          duration: 5000,
        })
      }

      captchaRef.current?.resetCaptcha()
    } catch (error) {
      toast.error('Failed to create account', {
        description: 'Please try again',
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className='mx-auto w-96'>
      <CardHeader>
        <CardTitle className='text-2xl'>Sign Up</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className='grid gap-4'>
            <FormField
              control={form.control}
              name='username'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder='SportzFreak123' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder='sportzfreak123@example.com' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='password'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <PasswordInput placeholder='sportzrul3!' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='confirmPassword'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <PasswordInput placeholder='sportzrul3!' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='captchaToken'
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className='flex justify-center items-center w-full flex-col'>
                      <HCaptcha
                        {...field}
                        ref={captchaRef}
                        id='signup-hcaptcha'
                        sitekey={process.env.HCAPTCHA_SITE_KEY!}
                        onVerify={(token) => field.onChange(token)}
                        theme={theme}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type='submit' className='w-full'>
              {loading ? <LoaderCircle className='animate-spin' /> : 'Sign Up'}
            </Button>
          </form>
        </Form>
        <div className='mt-4 text-center text-sm'>
          Already have an account?{' '}
          <Link href='#' className='underline' onClick={() => setView('login')}>
            Log In
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
