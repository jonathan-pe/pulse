import { useUser } from '@clerk/clerk-react'
import type { ClerkAPIResponseError, UpdateUserPasswordParams } from '@clerk/types'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2Icon, EyeIcon, EyeOffIcon } from 'lucide-react'
import { toast } from 'sonner'

type PasswordFormData = {
  currentPassword: string | undefined
  newPassword: string
  confirmPassword: string
}

type ChangePasswordFormProps = {
  onCancel: () => void
  onSave: () => void
}

export function ChangePasswordForm({ onCancel, onSave }: ChangePasswordFormProps) {
  const { user } = useUser()
  const [isUpdating, setIsUpdating] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Create dynamic validation schema based on user's password status
  const dynamicPasswordSchema = z
    .object({
      currentPassword:
        user?.passwordEnabled === true ? z.string().min(1, 'Current password is required') : z.string().optional(),
      newPassword: z.string().min(8, 'Password must be at least 8 characters'),
      confirmPassword: z.string().min(1, 'Please confirm your password'),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Passwords don't match",
      path: ['confirmPassword'],
    })

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(dynamicPasswordSchema),
  })

  const onSubmit = async (data: PasswordFormData) => {
    if (!user) return

    setIsUpdating(true)
    try {
      // Build params using Clerk's official type
      const updateParams: UpdateUserPasswordParams = {
        newPassword: data.newPassword,
        signOutOfOtherSessions: false,
      }

      // Include currentPassword only if user has password enabled
      if (user.passwordEnabled && data.currentPassword) {
        updateParams.currentPassword = data.currentPassword
      }

      await user.updatePassword(updateParams)

      toast.success('Password updated successfully')
      reset()
      onSave()
    } catch (error) {
      console.error('Error updating password:', error)

      // Type guard for ClerkAPIResponseError
      const isClerkError = (err: unknown): err is ClerkAPIResponseError => {
        return (
          typeof err === 'object' &&
          err !== null &&
          'clerkError' in err &&
          err.clerkError === true &&
          'errors' in err &&
          Array.isArray((err as ClerkAPIResponseError).errors)
        )
      }

      // Handle specific error cases using Clerk's type
      if (isClerkError(error)) {
        const hasReverificationError = error.errors.some((e) => e.code === 'session_reverification_required')
        const hasPasswordError = error.errors.some((e) => e.code?.includes('current_password'))

        if (hasReverificationError) {
          toast.error('For security, please sign out and sign back in before changing your password.', {
            duration: 5000,
          })
        } else if (hasPasswordError) {
          toast.error('Current password is incorrect. Please try again.')
        } else {
          // Show first error message from Clerk
          const errorMessage = error.errors[0]?.message || 'Failed to update password'
          toast.error(errorMessage)
        }
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update password'
        toast.error(errorMessage)
      }
    } finally {
      setIsUpdating(false)
    }
  }

  if (!user) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>Update your password to keep your account secure</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
          {/* Current Password - Only show if user has password enabled */}
          {user.passwordEnabled && (
            <div className='space-y-2'>
              <Label htmlFor='currentPassword'>Current Password</Label>
              <div className='relative'>
                <Input
                  id='currentPassword'
                  type={showCurrentPassword ? 'text' : 'password'}
                  {...register('currentPassword')}
                  placeholder='Enter current password'
                  className='pr-10'
                />
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  className='absolute right-0 top-0 h-full px-3 hover:bg-transparent'
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOffIcon className='h-4 w-4 text-muted-foreground' />
                  ) : (
                    <EyeIcon className='h-4 w-4 text-muted-foreground' />
                  )}
                </Button>
              </div>
              {errors.currentPassword && <p className='text-sm text-destructive'>{errors.currentPassword.message}</p>}
            </div>
          )}

          {/* Show message if user doesn't have password auth enabled */}
          {!user.passwordEnabled && (
            <div className='p-3 rounded-md bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800'>
              <p className='text-sm text-blue-900 dark:text-blue-100'>
                You signed up using a social provider. Set a password to enable password-based sign in.
              </p>
            </div>
          )}

          {/* New Password */}
          <div className='space-y-2'>
            <Label htmlFor='newPassword'>New Password</Label>
            <div className='relative'>
              <Input
                id='newPassword'
                type={showNewPassword ? 'text' : 'password'}
                {...register('newPassword')}
                placeholder='Enter new password'
                className='pr-10'
              />
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='absolute right-0 top-0 h-full px-3 hover:bg-transparent'
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOffIcon className='h-4 w-4 text-muted-foreground' />
                ) : (
                  <EyeIcon className='h-4 w-4 text-muted-foreground' />
                )}
              </Button>
            </div>
            {errors.newPassword && <p className='text-sm text-destructive'>{errors.newPassword.message}</p>}
          </div>

          {/* Confirm Password */}
          <div className='space-y-2'>
            <Label htmlFor='confirmPassword'>Confirm New Password</Label>
            <div className='relative'>
              <Input
                id='confirmPassword'
                type={showConfirmPassword ? 'text' : 'password'}
                {...register('confirmPassword')}
                placeholder='Confirm new password'
                className='pr-10'
              />
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='absolute right-0 top-0 h-full px-3 hover:bg-transparent'
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOffIcon className='h-4 w-4 text-muted-foreground' />
                ) : (
                  <EyeIcon className='h-4 w-4 text-muted-foreground' />
                )}
              </Button>
            </div>
            {errors.confirmPassword && <p className='text-sm text-destructive'>{errors.confirmPassword.message}</p>}
          </div>

          <div className='flex gap-3 pt-2'>
            <Button type='submit' disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2Icon className='h-4 w-4 mr-2 animate-spin' />
                  Updating...
                </>
              ) : (
                'Update Password'
              )}
            </Button>
            <Button type='button' variant='outline' onClick={onCancel} disabled={isUpdating}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
