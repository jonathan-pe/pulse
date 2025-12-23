import { useUser } from '@clerk/clerk-react'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAPI } from '@/hooks/useAPI'
import { type User } from '@pulse/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User2Icon, Loader2Icon, UploadIcon } from 'lucide-react'
import { toast } from 'sonner'

const profileSchema = z.object({
  displayName: z.string().max(50).optional(),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
})

type ProfileFormData = z.infer<typeof profileSchema>

type EditProfileFormProps = {
  onCancel: () => void
  onSave: () => void
}

export function EditProfileForm({ onCancel, onSave }: EditProfileFormProps) {
  const { user: clerkUser } = useUser()
  const fetchAPI = useAPI()
  const queryClient = useQueryClient()
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  // Fetch user data from our database
  const { data: pulseUser, isLoading } = useQuery<User>({
    queryKey: ['user', 'me'],
    queryFn: () => fetchAPI<User>('/auth/me'),
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  })

  // Update form when pulseUser loads
  useEffect(() => {
    if (pulseUser) {
      reset({
        displayName: pulseUser.displayName || '',
        username: pulseUser.username || '',
      })
    }
  }, [pulseUser, reset])

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      return fetchAPI<User>('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({
          username: data.username,
          displayName: data.displayName || null,
        }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] })
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
      toast.success('Profile updated successfully')
      onSave()
    },
    onError: (error: Error) => {
      console.error('Error updating profile:', error)
      toast.error(error.message || 'Failed to update profile')
    },
  })

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!clerkUser || !e.target.files?.[0]) return

    setIsUploadingImage(true)
    try {
      await clerkUser.setProfileImage({ file: e.target.files[0] })
      toast.success('Profile image updated successfully')
      // Invalidate user query to refresh image
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] })
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Failed to upload image')
    } finally {
      setIsUploadingImage(false)
    }
  }

  if (isLoading || !pulseUser || !clerkUser) {
    return (
      <Card>
        <CardContent className='py-8'>
          <div className='flex items-center justify-center'>
            <Loader2Icon className='h-8 w-8 animate-spin text-muted-foreground' />
          </div>
        </CardContent>
      </Card>
    )
  }

  const initials = pulseUser.username ? pulseUser.username.slice(0, 2).toUpperCase() : 'U'

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
        <CardDescription>Update your account information</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
          {/* Profile Image Section */}
          <div className='flex flex-col sm:flex-row items-start sm:items-center gap-4'>
            <Avatar className='h-24 w-24'>
              <AvatarImage src={clerkUser.imageUrl} alt={pulseUser.username || 'User'} />
              <AvatarFallback className='text-2xl'>{initials || <User2Icon className='h-12 w-12' />}</AvatarFallback>
            </Avatar>
            <div className='space-y-2'>
              <Label htmlFor='avatar-upload' className='text-sm font-medium'>
                Profile Image
              </Label>
              <div className='flex gap-2'>
                <Button type='button' variant='outline' size='sm' asChild disabled={isUploadingImage}>
                  <label htmlFor='avatar-upload' className='cursor-pointer'>
                    {isUploadingImage ? (
                      <>
                        <Loader2Icon className='h-4 w-4 mr-2 animate-spin' />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <UploadIcon className='h-4 w-4 mr-2' />
                        Upload Image
                      </>
                    )}
                  </label>
                </Button>
                <input
                  id='avatar-upload'
                  type='file'
                  accept='image/*'
                  className='hidden'
                  onChange={handleImageUpload}
                  disabled={isUploadingImage}
                />
                {clerkUser.imageUrl && (
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={async () => {
                      try {
                        await clerkUser.setProfileImage({ file: null })
                        toast.success('Profile image removed')
                        queryClient.invalidateQueries({ queryKey: ['user', 'me'] })
                        queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
                      } catch (error) {
                        toast.error('Failed to remove image')
                      }
                    }}
                  >
                    Remove
                  </Button>
                )}
              </div>
              <p className='text-xs text-muted-foreground'>JPG, PNG or GIF. Max size 10MB.</p>
            </div>
          </div>

          {/* Display Name Field */}
          <div className='space-y-2'>
            <Label htmlFor='displayName'>Display Name</Label>
            <Input id='displayName' {...register('displayName')} placeholder='Enter a display name (optional)' />
            {errors.displayName && <p className='text-sm text-destructive'>{errors.displayName.message}</p>}
            <p className='text-xs text-muted-foreground'>
              Optional. If not set, your username will be displayed instead.
            </p>
          </div>

          {/* Username */}
          <div className='space-y-2'>
            <Label htmlFor='username'>Username</Label>
            <div className='relative'>
              <span className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'>@</span>
              <Input id='username' {...register('username')} placeholder='johndoe' className='pl-7' />
            </div>
            {errors.username && <p className='text-sm text-destructive'>{errors.username.message}</p>}
            <p className='text-xs text-muted-foreground'>Your unique identifier. Used in URLs and for mentions.</p>
          </div>

          {/* Form Actions */}
          <div className='flex gap-3 pt-4'>
            <Button type='submit' disabled={!isDirty || updateProfileMutation.isPending}>
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2Icon className='h-4 w-4 mr-2 animate-spin' />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
            <Button type='button' variant='outline' onClick={onCancel} disabled={updateProfileMutation.isPending}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
