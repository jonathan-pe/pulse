import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useUser, useClerk } from '@clerk/clerk-react'
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useAPI } from '@/hooks/useAPI'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { User2Icon, Trash2 } from 'lucide-react'
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

  // Build display name from available fields
  const displayName =
    user.fullName || user.firstName || user.username || user.primaryEmailAddress?.emailAddress || 'User'

  const initials = displayName
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

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
              <AvatarImage src={user.imageUrl} alt={displayName} />
              <AvatarFallback className='text-2xl'>{initials || <User2Icon className='h-12 w-12' />}</AvatarFallback>
            </Avatar>

            <div className='flex-1 space-y-3'>
              <div>
                <p className='text-sm text-muted-foreground'>Display Name</p>
                <p className='font-medium'>{displayName}</p>
              </div>

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

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant='destructive' disabled={isDeleting}>
                    <Trash2 className='mr-2 h-4 w-4' />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your account and remove all your data
                      from our servers, including:
                      <ul className='list-disc list-inside mt-2 space-y-1'>
                        <li>All predictions and history</li>
                        <li>Points and leaderboard standings</li>
                        <li>Achievements and badges</li>
                        <li>Account information</li>
                      </ul>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                      className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                    >
                      {isDeleting ? 'Deleting...' : 'Yes, delete my account'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
