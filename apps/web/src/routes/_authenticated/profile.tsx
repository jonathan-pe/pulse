import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useUser, useClerk } from '@clerk/clerk-react'
import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useAPI } from '@/hooks/useAPI'
import { type User } from '@pulse/types'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DeleteAccountDialog } from '@/components/profile/DeleteAccountDialog'
import { EditProfileForm } from '@/components/profile/EditProfileForm'
import { ChangeEmailForm } from '@/components/profile/ChangeEmailForm'
import { ChangePasswordForm } from '@/components/profile/ChangePasswordForm'
import { User2Icon, PencilIcon, MailIcon, KeyRoundIcon } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/_authenticated/profile')({
  component: Profile,
})

type EditMode = 'view' | 'profile' | 'email' | 'password'

function Profile() {
  const { user: clerkUser, isLoaded } = useUser()
  const { signOut } = useClerk()
  const navigate = useNavigate()
  const fetchAPI = useAPI()
  const [isDeleting, setIsDeleting] = useState(false)
  const [editMode, setEditMode] = useState<EditMode>('view')

  // Fetch user data from our database
  const { data: pulseUser, isLoading: isLoadingPulseUser } = useQuery<User>({
    queryKey: ['user', 'me'],
    queryFn: () => fetchAPI<User>('/auth/me'),
    enabled: isLoaded && !!clerkUser,
  })

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      return fetchAPI<{ success: boolean; message: string }>('/auth/me', {
        method: 'DELETE',
      })
    },
    onSuccess: async () => {
      toast.success('Account deleted successfully')
      // Sign out and redirect to home after deletion
      await signOut()
      navigate({ to: '/' })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete account')
      setIsDeleting(false)
    },
  })

  const handleDeleteAccount = () => {
    setIsDeleting(true)
    deleteAccountMutation.mutate()
  }

  if (!isLoaded || isLoadingPulseUser) {
    return (
      <div className='w-full h-full overflow-y-auto'>
        <div className='container max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8'>
          <div className='flex items-center justify-center h-96'>
            <div className='text-muted-foreground'>Loading profile...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!clerkUser || !pulseUser) {
    return null
  }

  const displayName = pulseUser.displayName || `@${pulseUser.username}`
  const initials = pulseUser.username ? pulseUser.username.slice(0, 2).toUpperCase() : 'U'
  const memberSince = new Date(pulseUser.createdAt).toLocaleDateString()

  return (
    <div className='w-full h-full overflow-y-auto'>
      <div className='container max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8'>
        {/* Edit Profile Form */}
        {editMode === 'profile' && (
          <div className='mb-6'>
            <EditProfileForm onCancel={() => setEditMode('view')} onSave={() => setEditMode('view')} />
          </div>
        )}

        {/* Change Email Form */}
        {editMode === 'email' && (
          <div className='mb-6'>
            <ChangeEmailForm onCancel={() => setEditMode('view')} onSave={() => setEditMode('view')} />
          </div>
        )}

        {/* Change Password Form */}
        {editMode === 'password' && (
          <div className='mb-6'>
            <ChangePasswordForm onCancel={() => setEditMode('view')} onSave={() => setEditMode('view')} />
          </div>
        )}

        {/* User Info Card (View Mode) */}
        {editMode === 'view' && (
          <>
            <Card className='mb-6'>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <div>
                    <CardTitle>Account Information</CardTitle>
                    <CardDescription>Your basic account details</CardDescription>
                  </div>
                  <Button variant='outline' size='sm' onClick={() => setEditMode('profile')}>
                    <PencilIcon className='h-4 w-4 mr-2' />
                    Edit Profile
                  </Button>
                </div>
              </CardHeader>
              <CardContent className='flex flex-col sm:flex-row gap-6'>
                <Avatar className='h-24 w-24'>
                  <AvatarImage src={clerkUser.imageUrl} alt={pulseUser.username || 'User'} />
                  <AvatarFallback className='text-2xl'>
                    {initials || <User2Icon className='h-12 w-12' />}
                  </AvatarFallback>
                </Avatar>

                <div className='flex-1 space-y-3'>
                  <div>
                    <p className='text-sm text-muted-foreground'>Display Name</p>
                    <p className='font-medium'>{displayName}</p>
                  </div>

                  <div>
                    <p className='text-sm text-muted-foreground'>Username</p>
                    <p className='font-medium'>@{pulseUser.username}</p>
                  </div>

                  <div>
                    <p className='text-sm text-muted-foreground'>Email</p>
                    <p className='font-medium'>{clerkUser.primaryEmailAddress?.emailAddress || 'Not set'}</p>
                  </div>

                  <div>
                    <p className='text-sm text-muted-foreground'>Member Since</p>
                    <p className='font-medium'>{memberSince}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Settings Card */}
            <Card className='mb-6'>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage your account security</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b'>
                  <div>
                    <p className='font-medium flex items-center gap-2'>
                      <MailIcon className='h-4 w-4' />
                      Email Address
                    </p>
                    <p className='text-sm text-muted-foreground'>Change your email address</p>
                  </div>
                  <Button variant='outline' size='sm' onClick={() => setEditMode('email')}>
                    Change Email
                  </Button>
                </div>

                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
                  <div>
                    <p className='font-medium flex items-center gap-2'>
                      <KeyRoundIcon className='h-4 w-4' />
                      Password
                    </p>
                    <p className='text-sm text-muted-foreground'>Update your password</p>
                  </div>
                  <Button variant='outline' size='sm' onClick={() => setEditMode('password')}>
                    Change Password
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Red Zone (only visible in view mode) */}
            <Card className='border-destructive/50'>
              <CardHeader>
                <CardTitle className='text-destructive'>Red Zone</CardTitle>
                <CardDescription>Irreversible actions for your account</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                  <div>
                    <p className='font-medium'>Delete Account</p>
                    <p className='text-sm text-muted-foreground'>
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                  </div>

                  <DeleteAccountDialog isDeleting={isDeleting} onConfirm={handleDeleteAccount} />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
