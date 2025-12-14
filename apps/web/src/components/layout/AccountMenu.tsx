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

  const computedInitials = user?.username ? user.username.slice(0, 2).toUpperCase() : <User2Icon />

  // Prefer explicit, typed fields; fall back gracefully
  const imageSrc =
    avatarSrc || user?.imageUrl || (user as { profileImageUrl?: string } | undefined)?.profileImageUrl || ''

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
        {user ? (
          <div className='px-2 py-2'>
            <div className='text-sm font-medium'>@{user.username}</div>
            <div className='text-xs text-muted-foreground'>
              {user.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || ''}
            </div>
          </div>
        ) : null}

        <DropdownMenuSeparator />

        {user ? (
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
