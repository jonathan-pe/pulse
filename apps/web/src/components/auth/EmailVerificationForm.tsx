import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { useState } from 'react'
import { useSignUp } from '@clerk/clerk-react'
import { useNavigate } from '@tanstack/react-router'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'

const EmailVerificationSchema = z.object({
  code: z.string().min(6).max(6),
})

interface EmailVerificationFormProps {
  setVerifying: (verifying: boolean) => void
}

const EmailVerificationForm = ({ setVerifying }: EmailVerificationFormProps) => {
  const { isLoaded, signUp, setActive } = useSignUp()
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const form = useForm<z.infer<typeof EmailVerificationSchema>>({
    resolver: zodResolver(EmailVerificationSchema),
    defaultValues: {
      code: '',
    },
  })

  // Handle the submission of the verification form
  const handleVerify = async (data: z.infer<typeof EmailVerificationSchema>) => {
    setLoading(true)

    const { code } = data

    if (!isLoaded) {
      setLoading(false)
      setVerifying(false)
      return
    }

    try {
      // Use the code the user provided to attempt verification
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      })

      // If verification was completed, set the session to active
      // and redirect the user
      if (signUpAttempt.status === 'complete') {
        await setActive({
          session: signUpAttempt.createdSessionId,
          navigate: async ({ session }) => {
            if (session?.currentTask) {
              // Check for tasks and navigate to custom UI to help users resolve them
              // See https://clerk.com/docs/custom-flows/overview#session-tasks
              // Avoid logging session task to console
              return
            }

            navigate({ to: '/' })
          },
        })
      } else {
        // If the status is not complete, check why. User may need to
        // complete further steps.
        // Silence verbose attempt logging
        // Silence entered code logging
      }
    } catch (err: unknown) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(err)
    } finally {
      setLoading(false)
      setVerifying(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleVerify)} className='space-y-8'>
        <FormField
          control={form.control}
          name='code'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Verification Code</FormLabel>
              <FormControl>
                <InputOTP maxLength={6} {...field}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type='submit' disabled={loading}>
          {loading ? 'Verifying...' : 'Verify'}
        </Button>
      </form>
    </Form>
  )
}

export default EmailVerificationForm
