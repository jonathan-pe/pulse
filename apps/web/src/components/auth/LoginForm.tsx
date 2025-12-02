import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useSignIn } from '@clerk/clerk-react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { isClerkAPIResponseError } from '@clerk/clerk-react/errors'
import z from 'zod'

const LoginSchema = z.object({
  identifier: z.string().min(3).max(64),
  password: z.string().min(8).max(72),
})

interface LoginFormProps {
  loading: boolean
  setLoading: (loading: boolean) => void
}

const LoginForm = ({ loading, setLoading }: LoginFormProps) => {
  const { signIn, isLoaded, setActive } = useSignIn()
  const navigate = useNavigate()

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  })

  async function handleSubmit(data: z.infer<typeof LoginSchema>) {
    setLoading(true)

    const { identifier, password } = data

    if (!isLoaded) {
      setLoading(false)
      return
    }

    try {
      const signInAttempt = await signIn.create({
        identifier,
        password,
      })

      // If sign-in process is complete, set the created session as active
      // and redirect the user
      if (signInAttempt.status === 'complete') {
        await setActive({
          session: signInAttempt.createdSessionId,
          navigate: async ({ session }) => {
            if (session?.currentTask) {
              // Check for tasks and navigate to custom UI to help users resolve them
              // See https://clerk.com/docs/custom-flows/overview#session-tasks
              console.log(session?.currentTask)
              return
            }

            navigate({ to: '/' })
          },
        })
      } else {
        // If the status is not complete, check why. User may need to
        // complete further steps.
        // eslint-disable-next-line no-console
        console.error(JSON.stringify(signInAttempt, null, 2))
        toast.error('Sign in incomplete. Please try again.')
      }
    } catch (err: unknown) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      // eslint-disable-next-line no-console
      console.error(JSON.stringify(err, null, 2))

      // Extract user-friendly error message from Clerk error
      if (isClerkAPIResponseError(err)) {
        const clerkError = err.errors[0]
        // Map common Clerk error codes to friendly messages
        // Note: We use the same generic message for identifier_not_found and password_incorrect
        // to prevent account enumeration attacks
        const errorMessages: Record<string, string> = {
          form_identifier_not_found: 'Invalid email/username or password.',
          form_password_incorrect: 'Invalid email/username or password.',
          form_password_pwned: 'This password has been compromised. Please use a different password.',
          session_exists: 'You are already signed in.',
          identifier_already_signed_in: 'You are already signed in with this account.',
        }

        const friendlyMessage = errorMessages[clerkError?.code] || clerkError?.longMessage || clerkError?.message
        toast.error(friendlyMessage || 'Unable to sign in. Please try again.')
      } else {
        toast.error('Unable to sign in. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className='flex flex-col gap-3'>
        <FormField
          control={form.control}
          name='identifier'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username or Email</FormLabel>
              <FormControl>
                <Input {...field} />
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
                <Input {...field} type='password' />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div id='clerk-captcha' />

        <Button type='submit' disabled={loading || !isLoaded} className='w-full' size='lg'>
          Log in
        </Button>
      </form>
    </Form>
  )
}

export default LoginForm
