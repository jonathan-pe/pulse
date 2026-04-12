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

const fallbackTextClasses = {
  sm: 'text-[10px]',
  md: 'text-xs',
  lg: 'text-sm',
}

/** Symmetric inset so wide/tall marks aren’t clipped at the circle edge */
const logoImagePadding = {
  sm: 'p-0.5',
  md: 'p-1.5',
  lg: 'p-2.5',
}

/** Themed plate (see --team-logo-plate in index.css); after:hidden avoids avatar blend overlay on raster logos */
const logoPlateClasses = 'bg-team-logo-plate ring-1 ring-inset ring-border after:hidden'

const fallbackPlateClasses = 'bg-team-logo-plate text-team-logo-plate-fg font-semibold'

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
    <Avatar className={cn(sizeClasses[size], logoPlateClasses, className)}>
      {logoUrl && (
        <AvatarImage
          fit='contain'
          src={logoUrl}
          alt={`${teamName} logo`}
          className={logoImagePadding[size]}
        />
      )}
      <AvatarFallback className={cn(fallbackPlateClasses, fallbackTextClasses[size])}>
        {fallbackText}
      </AvatarFallback>
    </Avatar>
  )
}
