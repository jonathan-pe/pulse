import { Clock, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getLeagueBadgeColor } from '@/lib/league-colors'

type GameCardHeaderProps = {
  league: string
  isGameLocked: boolean
  status: string
  startsAt: Date | string
}

function formatGameTime(startsAt: Date | string) {
  const date = new Date(startsAt)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(date)
}

export function GameCardHeader({ league, isGameLocked, status, startsAt }: GameCardHeaderProps) {
  return (
    <div className='mb-3 flex items-center justify-between'>
      <Badge variant='outline' className={getLeagueBadgeColor(league)}>
        {league}
      </Badge>

      {isGameLocked ? (
        <Badge variant='secondary' className='text-xs'>
          <CheckCircle2 className='mr-1 h-3 w-3' />
          {status}
        </Badge>
      ) : (
        <div className='flex items-center gap-1 text-xs text-muted-foreground'>
          <Clock className='h-3 w-3' />
          {formatGameTime(startsAt)}
        </div>
      )}
    </div>
  )
}
