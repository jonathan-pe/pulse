import { useUser } from '@clerk/clerk-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { EmailAddressResource } from '@clerk/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2Icon, MailIcon } from 'lucide-react'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { toast } from 'sonner'

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

const verificationSchema = z.object({
  code: z.string().length(6, 'Verification code must be 6 digits'),
})

type EmailFormData = z.infer<typeof emailSchema>
type VerificationFormData = z.infer<typeof verificationSchema>

type ChangeEmailFormProps = {
  onCancel: () => void
  onSave: () => void
}

export function ChangeEmailForm({ onCancel, onSave }: ChangeEmailFormProps) {
  const { user } = useUser()
  const [isUpdating, setIsUpdating] = useState(false)
  const [verificationStep, setVerificationStep] = useState<'email' | 'code'>('email')
  const [pendingEmailAddress, setPendingEmailAddress] = useState<EmailAddressResource | null>(null)

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: user?.primaryEmailAddress?.emailAddress || '',
    },
  })

  const verificationForm = useForm<VerificationFormData>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      code: '',
    },
  })

  const onSubmitEmail = async (data: EmailFormData) => {
    if (!user) return

    setIsUpdating(true)
    try {
      // Check if email address already exists and remove it if unverified
      const existingEmail = user.emailAddresses.find((email) => email.emailAddress === data.email)
      if (existingEmail && existingEmail.verification?.status !== 'verified') {
        // Remove the unverified email address before creating a new one
        await existingEmail.destroy()
      }

      // Create new email address
      const emailAddress = await user.createEmailAddress({ email: data.email })

      // Prepare verification (sends email)
      await emailAddress.prepareVerification({ strategy: 'email_code' })

      setPendingEmailAddress(emailAddress)
      setVerificationStep('code')
      toast.success('Verification code sent! Please check your inbox.')
    } catch (error) {
      console.error('Error updating email:', error)

      // Handle reverification error specifically
      if (
        error &&
        typeof error === 'object' &&
        'errors' in error &&
        Array.isArray(error.errors) &&
        error.errors.some((e: { code?: string }) => e.code === 'session_reverification_required')
      ) {
        toast.error('For security, please sign out and sign back in before changing your email address.', {
          duration: 5000,
        })
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Failed to send verification code'
        toast.error(errorMessage)
      }
    } finally {
      setIsUpdating(false)
    }
  }

  const onSubmitVerification = async (data: VerificationFormData) => {
    if (!pendingEmailAddress) return

    setIsUpdating(true)
    try {
      // Verify the email with the code
      await pendingEmailAddress.attemptVerification({ code: data.code })

      // Set as primary email
      await user?.update({
        primaryEmailAddressId: pendingEmailAddress.id,
      })

      toast.success('Email updated successfully!')
      onSave()
    } catch (error) {
      console.error('Error verifying email:', error)
      const errorMessage = error instanceof Error ? error.message : 'Invalid verification code'
      toast.error(errorMessage)
    } finally {
      setIsUpdating(false)
    }
  }

  if (!user) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Email</CardTitle>
        <CardDescription>
          {verificationStep === 'email'
            ? "Update your email address. You'll need to verify the new email."
            : 'Enter the verification code sent to your new email address.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {verificationStep === 'email' ? (
          <form onSubmit={emailForm.handleSubmit(onSubmitEmail)} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='email'>Email Address</Label>
              <div className='relative'>
                <MailIcon className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                <Input
                  id='email'
                  type='email'
                  {...emailForm.register('email')}
                  placeholder='john@example.com'
                  className='pl-9'
                />
              </div>
              {emailForm.formState.errors.email && (
                <p className='text-sm text-destructive'>{emailForm.formState.errors.email.message}</p>
              )}
            </div>

            <div className='flex gap-3 pt-2'>
              <Button type='submit' disabled={!emailForm.formState.isDirty || isUpdating}>
                {isUpdating ? (
                  <>
                    <Loader2Icon className='h-4 w-4 mr-2 animate-spin' />
                    Sending...
                  </>
                ) : (
                  'Send Verification Code'
                )}
              </Button>
              <Button type='button' variant='outline' onClick={onCancel} disabled={isUpdating}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={verificationForm.handleSubmit(onSubmitVerification)} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='code'>Verification Code</Label>
              <InputOTP
                maxLength={6}
                value={verificationForm.watch('code')}
                onChange={(value) => verificationForm.setValue('code', value)}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
              {verificationForm.formState.errors.code && (
                <p className='text-sm text-destructive'>{verificationForm.formState.errors.code.message}</p>
              )}
            </div>

            <div className='p-3 rounded-md bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800'>
              <p className='text-sm text-blue-900 dark:text-blue-100'>
                Check your inbox at <strong>{emailForm.getValues('email')}</strong> for the verification code.
              </p>
            </div>

            <div className='flex gap-3 pt-2'>
              <Button type='submit' disabled={isUpdating || verificationForm.watch('code').length !== 6}>
                {isUpdating ? (
                  <>
                    <Loader2Icon className='h-4 w-4 mr-2 animate-spin' />
                    Verifying...
                  </>
                ) : (
                  'Verify Email'
                )}
              </Button>
              <Button
                type='button'
                variant='outline'
                onClick={() => setVerificationStep('email')}
                disabled={isUpdating}
              >
                Back
              </Button>
              <Button type='button' variant='ghost' onClick={onCancel} disabled={isUpdating}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
