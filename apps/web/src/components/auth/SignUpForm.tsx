import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useSignUp } from '@clerk/clerk-react'
import { useState } from 'react'
import { Eye, EyeClosed } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'

const SignUpSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(72),
  username: z.string().min(3).max(64),
})

interface SignUpFormProps {
  setVerifying: (verifying: boolean) => void
}

const SignUpForm = ({ setVerifying }: SignUpFormProps) => {
  const { isLoaded, signUp } = useSignUp()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<z.infer<typeof SignUpSchema>>({
    resolver: zodResolver(SignUpSchema),
    defaultValues: {
      email: '',
      password: '',
      username: '',
    },
  })

  const handleSubmit = async (data: z.infer<typeof SignUpSchema>) => {
    setLoading(true)

    const { email, password, username } = data

    if (!isLoaded) {
      setLoading(false)
      return
    }

    try {
      await signUp.create({
        emailAddress: email,
        password,
        username,
      })

      // Send the user an email with the verification code
      await signUp.prepareEmailAddressVerification({
        strategy: 'email_code',
      })

      setVerifying(true)
    } catch (err: unknown) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2))
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-8'>
        <FormField
          control={form.control}
          name='username'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder='LuckyGamer123' {...field} />
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
                <Input placeholder='LuckyGamer123@example.com' {...field} />
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
                <div className='relative'>
                  <Input placeholder='secret_password_123!' {...field} type={showPassword ? 'text' : 'password'} />
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    aria-pressed={showPassword}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((s) => !s)}
                    className='absolute right-2 top-1/2 -translate-y-1/2'
                  >
                    {showPassword ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <EyeClosed />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>Hide password</TooltipContent>
                      </Tooltip>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <Eye />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>Show password</TooltipContent>
                      </Tooltip>
                    )}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div id='clerk-captcha' />

        <Button type='submit' disabled={loading || !isLoaded} className='w-full'>
          {loading ? 'Signing up...' : 'Sign up'}
        </Button>
      </form>
    </Form>
  )
}

export default SignUpForm
