import { useSignUp } from '@clerk/clerk-react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export const Route = createFileRoute('/_unauthenticated/login/continue')({
  component: ContinueSignUp,
})

/**
 * Continue page for OAuth sign-up flows with missing requirements.
 *
 * When a user signs in via OAuth but doesn't have an account yet,
 * Clerk transfers the flow to sign-up. If there are missing requirements
 * (like username), the user is redirected here to complete their profile.
 *
 * Uses the useSignUp() hook because missing_requirements is only available
 * on the SignUp object, even though the user started from a sign-in flow.
 *
 * @see https://clerk.com/docs/guides/development/custom-flows/authentication/oauth-connections#handle-missing-requirements
 */
function ContinueSignUp() {
  const navigate = useNavigate()
  const { isLoaded, signUp, setActive } = useSignUp()
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  if (!isLoaded) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-muted-foreground'>Loading...</div>
      </div>
    )
  }

  // Protect the page from users who are not in the sign-up flow
  // such as users who visited this route directly
  if (!signUp?.id) {
    navigate({ to: '/login' })
    return null
  }

  const status = signUp.status
  const missingFields = signUp.missingFields ?? []

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const result = await signUp.update(formData)

      if (result.status === 'complete' && result.createdSessionId) {
        await setActive({ session: result.createdSessionId })
        toast.success('Account created successfully!')
        navigate({ to: '/' })
      } else if (result.status === 'missing_requirements') {
        // Still has missing fields - form will re-render with updated missingFields
        toast.error('Please fill in all required fields.')
      }
    } catch (err) {
      console.error('Error completing sign up:', err)
      toast.error('Error completing sign up. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'missing_requirements') {
    return (
      <div className='min-h-screen flex items-center justify-center p-4'>
        <Card className='w-full max-w-md'>
          <CardHeader className='text-center'>
            <CardTitle className='text-2xl'>Complete your profile</CardTitle>
            <CardDescription>Just one more step to create your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className='space-y-4'>
              {missingFields.includes('username') && (
                <div className='space-y-2'>
                  <Label htmlFor='username'>Username</Label>
                  <Input
                    id='username'
                    type='text'
                    placeholder='Choose a username'
                    value={formData.username || ''}
                    onChange={(e) => handleChange('username', e.target.value)}
                    required
                    minLength={3}
                    maxLength={64}
                  />
                </div>
              )}

              {/* Clerk's bot sign-up protection (captcha) */}
              <div id='clerk-captcha' />

              <Button type='submit' className='w-full' disabled={submitting}>
                {submitting ? 'Creating account...' : 'Complete sign up'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Handle other statuses or completed state
  if (status === 'complete') {
    navigate({ to: '/' })
    return null
  }

  // Fallback for unexpected states
  return (
    <div className='min-h-screen flex items-center justify-center p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <CardTitle className='text-2xl'>Something went wrong</CardTitle>
          <CardDescription>We couldn't complete your sign up. Please try again.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className='w-full' onClick={() => navigate({ to: '/login' })}>
            Back to Login
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
