import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useUser, useClerk } from '@clerk/clerk-react'
import { SignedOut } from '@clerk/clerk-react'
import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useAPI } from '@/hooks/useAPI'
import { type User } from '@pulse/types'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { User2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'

type AccountMenuProps = {
  avatarSrc?: string
  initials?: string | undefined
  onLogout?: () => void
}

export default function AccountMenu({ avatarSrc, onLogout }: AccountMenuProps) {
  const { user: clerkUser, isLoaded } = useUser()
  const clerk = useClerk()
  const fetchAPI = useAPI()

  // Fetch user data from our database
  const { data: pulseUser } = useQuery<User>({
    queryKey: ['user', 'me'],
    queryFn: () => fetchAPI<User>('/auth/me'),
    enabled: isLoaded && !!clerkUser,
  })

  const displayName = pulseUser?.displayName || (pulseUser?.username ? `@${pulseUser.username}` : undefined)
  const computedInitials = pulseUser?.username ? pulseUser.username.slice(0, 2).toUpperCase() : <User2Icon />

  // Prefer explicit, typed fields; fall back gracefully
  const imageSrc =
    avatarSrc || clerkUser?.imageUrl || (clerkUser as { profileImageUrl?: string } | undefined)?.profileImageUrl || ''

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className='rounded-full focus:outline-none' aria-label='Account' asChild size='icon'>
          <Avatar>
            <AvatarImage src={imageSrc} alt='User avatar' />
            <AvatarFallback>{computedInitials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align='end'>
        {/* User info */}
        {clerkUser && pulseUser ? (
          <div className='px-2 py-2'>
            <div className='text-sm font-medium'>{displayName}</div>
            <div className='text-xs text-muted-foreground'>
              {clerkUser.primaryEmailAddress?.emailAddress || clerkUser?.emailAddresses?.[0]?.emailAddress || ''}
            </div>
          </div>
        ) : null}

        <DropdownMenuSeparator />

        {clerkUser ? (
          <>
            <DropdownMenuItem asChild>
              <Link to='/profile' className='hover:cursor-pointer'>
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                if (onLogout) return onLogout()
                // use Clerk signOut
                void clerk.signOut()
              }}
              className='hover:cursor-pointer text-destructive'
            >
              Logout
            </DropdownMenuItem>
          </>
        ) : (
          <SignedOut>
            <DropdownMenuItem asChild>
              <Link to='/login'>Log in</Link>
            </DropdownMenuItem>
          </SignedOut>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
