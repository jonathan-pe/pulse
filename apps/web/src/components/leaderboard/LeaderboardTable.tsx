import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { LeaderboardPeriod, LeaderboardEntry } from '@pulse/types'
import { useUser } from '@clerk/clerk-react'
import { DAILY_RESET_HOUR_UTC } from '@pulse/shared'

interface LeaderboardTableProps {
  leaderboard: LeaderboardEntry[] | undefined
  isLoading: boolean
  period: LeaderboardPeriod
}

/**
 * Get the formatted reset time for period filters in the user's local timezone
 */
function getResetTimeDescription(period: LeaderboardPeriod): string {
  if (period === 'alltime') return 'Total points earned all-time'

  const now = new Date()

  if (period === 'daily') {
    const nextResetUTC = new Date(now)
    nextResetUTC.setUTCHours(DAILY_RESET_HOUR_UTC, 0, 0, 0)

    if (now >= nextResetUTC) {
      nextResetUTC.setDate(nextResetUTC.getDate() + 1)
    }

    const resetTime = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short',
    }).format(nextResetUTC)

    return `Resets daily at ${resetTime}`
  }

  if (period === 'weekly') {
    const nextSundayUTC = new Date(now)
    nextSundayUTC.setUTCHours(DAILY_RESET_HOUR_UTC, 0, 0, 0)
    const daysUntilSunday = (7 - nextSundayUTC.getUTCDay()) % 7
    if (daysUntilSunday === 0 && now >= nextSundayUTC) {
      nextSundayUTC.setDate(nextSundayUTC.getDate() + 7)
    } else {
      nextSundayUTC.setDate(nextSundayUTC.getDate() + daysUntilSunday)
    }

    const resetTime = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short',
    }).format(nextSundayUTC)

    return `Resets ${resetTime}`
  }

  return ''
}

function periodTitle(period: LeaderboardPeriod): string {
  if (period === 'daily') return 'Today'
  if (period === 'weekly') return 'This week'
  return 'All time'
}

export function LeaderboardTable({ leaderboard, isLoading, period }: LeaderboardTableProps) {
  const { user } = useUser()
  const resetDescription = getResetTimeDescription(period)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{periodTitle(period)}</CardTitle>
        <CardDescription>{resetDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className='h-96 flex items-center justify-center text-muted-foreground'>Loading…</div>
        ) : !leaderboard || leaderboard.length === 0 ? (
          <div className='h-96 flex items-center justify-center text-muted-foreground'>
            No entries for this period yet
          </div>
        ) : (
          <div className='space-y-3'>
            {leaderboard.map((entry) => {
              const isCurrentUser = user?.id && entry.userId === user.id
              return (
                <div
                  key={entry.userId}
                  className={
                    'flex items-center gap-4 p-3 rounded-lg border hover:bg-accent/50 transition-colors ' +
                    (isCurrentUser ? 'bg-primary/10 border-primary' : '')
                  }
                >
                  <div className='w-14 shrink-0 text-center'>
                    <span className='text-base font-semibold tabular-nums text-muted-foreground'>#{entry.rank}</span>
                  </div>

                  <Avatar className='h-10 w-10'>
                    {entry.imageUrl && (
                      <AvatarImage src={entry.imageUrl} alt={entry.displayName || entry.username || 'User'} />
                    )}
                    <AvatarFallback>{(entry.displayName || entry.username)?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className='flex-1 min-w-0'>
                    <div className='font-semibold truncate'>
                      {entry.displayName || (entry.username ? entry.username : 'Anonymous')}
                    </div>
                  </div>

                  <div className='text-right min-w-24 shrink-0'>
                    <div className='text-lg font-bold tabular-nums'>{entry.points.toLocaleString()}</div>
                    <div className='text-xs text-muted-foreground'>points</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
