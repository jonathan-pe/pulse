import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useUser, useClerk } from '@clerk/clerk-react'
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useAPI } from '@/hooks/useAPI'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
// import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DeleteAccountDialog } from '@/components/profile/DeleteAccountDialog'
import { User2Icon } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/_authenticated/profile')({
  component: Profile,
})

function Profile() {
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()
  const navigate = useNavigate()
  const fetchAPI = useAPI()
  const [isDeleting, setIsDeleting] = useState(false)

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

  if (!isLoaded) {
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

  if (!user) {
    return null
  }

  const initials = user.username ? user.username.slice(0, 2).toUpperCase() : 'U'

  const memberSince = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'

  return (
    <div className='w-full h-full overflow-y-auto'>
      <div className='container max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8'>
        <h1 className='text-2xl font-bold mb-6'>Profile</h1>

        {/* User Info Card */}
        <Card className='mb-6'>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your basic account details</CardDescription>
          </CardHeader>
          <CardContent className='flex flex-col sm:flex-row gap-6'>
            <Avatar className='h-24 w-24'>
              <AvatarImage src={user.imageUrl} alt={user.username || 'User'} />
              <AvatarFallback className='text-2xl'>{initials || <User2Icon className='h-12 w-12' />}</AvatarFallback>
            </Avatar>

            <div className='flex-1 space-y-3'>
              {(user.fullName || user.firstName || user.lastName) && (
                <div>
                  <p className='text-sm text-muted-foreground'>Name</p>
                  <p className='font-medium'>
                    {user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim()}
                  </p>
                </div>
              )}

              {user.username && (
                <div>
                  <p className='text-sm text-muted-foreground'>Username</p>
                  <p className='font-medium'>@{user.username}</p>
                </div>
              )}

              <div>
                <p className='text-sm text-muted-foreground'>Email</p>
                <p className='font-medium'>{user.primaryEmailAddress?.emailAddress || 'Not set'}</p>
              </div>

              <div>
                <p className='text-sm text-muted-foreground'>Member Since</p>
                <p className='font-medium'>{memberSince}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Red Zone */}
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
      </div>
    </div>
  )
}
