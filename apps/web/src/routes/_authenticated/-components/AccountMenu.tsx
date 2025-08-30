import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useUser, useClerk } from '@clerk/clerk-react'
import { SignedOut } from '@clerk/clerk-react'
import { Link } from '@tanstack/react-router'
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
  const { user } = useUser()
  const clerk = useClerk()

  // Build display name and initials from available user fields
  const nameCandidates = [
    (user as any)?.firstName,
    (user as any)?.lastName ? `${(user as any).firstName} ${(user as any).lastName}` : undefined,
    (user as any)?.fullName,
    user?.username,
    user?.primaryEmailAddress?.emailAddress,
  ].filter(Boolean) as string[]

  const displayName = nameCandidates[0] ?? ''

  const computeInitialsFrom = (s: string) =>
    s
      .split(' ')
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()

  const computedInitials = displayName ? computeInitialsFrom(displayName) : <User2Icon />

  // Clerk's user type can differ between versions; safely try common avatar fields
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userAny = user as any
  const imageSrc = avatarSrc || userAny?.imageUrl || userAny?.profileImageUrl || ''

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className='ml-2 rounded-full focus:outline-none' aria-label='Account' asChild size='icon'>
          <Avatar>
            <AvatarImage src={imageSrc} alt='User avatar' />
            <AvatarFallback>{computedInitials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align='end'>
        {/* User info */}
        {user ? (
          <div className='px-2 py-2'>
            <div className='text-sm font-medium'>{displayName || user.username}</div>
            <div className='text-xs text-muted-foreground'>
              {user.primaryEmailAddress?.emailAddress || (user as any)?.emailAddresses?.[0]?.emailAddress || ''}
            </div>
          </div>
        ) : null}

        <DropdownMenuSeparator />

        {user ? (
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
