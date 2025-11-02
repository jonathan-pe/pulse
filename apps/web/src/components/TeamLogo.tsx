import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface TeamLogoProps {
  teamName: string
  teamCode?: string | null
  logoUrl?: string | null
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-10 w-10',
  lg: 'h-16 w-16',
}

/**
 * Display a team logo with fallback to team code/abbreviation
 */
export function TeamLogo({ teamName, teamCode, logoUrl, className, size = 'md' }: TeamLogoProps) {
  // Use team code if available, otherwise generate initials from team name
  const fallbackText = teamCode
    ? teamCode.toUpperCase()
    : teamName
    ? teamName
        .split(' ')
        .map((s) => s[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '??'

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {logoUrl && <AvatarImage src={logoUrl} alt={`${teamName} logo`} className='object-contain p-0.5' />}
      <AvatarFallback>{fallbackText}</AvatarFallback>
    </Avatar>
  )
}
