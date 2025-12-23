import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { LeaderboardPeriod, LeaderboardEntry } from '@pulse/types'
import { useUser } from '@clerk/clerk-react'
import { DAILY_RESET_HOUR_UTC } from '@pulse/shared'

interface LeaderboardTableProps {
  leaderboard: LeaderboardEntry[] | undefined
  isLoading: boolean
  period: LeaderboardPeriod
}

/**
 * Get the formatted reset time for leaderboard periods in user's local timezone
 */
function getResetTimeDescription(period: LeaderboardPeriod): string {
  if (period === 'alltime') return 'Total points earned all-time'

  const now = new Date()

  if (period === 'daily') {
    // Calculate next reset time (10am UTC = 5am ET / 2am PT)
    const nextResetUTC = new Date(now)
    nextResetUTC.setUTCHours(DAILY_RESET_HOUR_UTC, 0, 0, 0)

    // If we're past today's reset, show tomorrow's reset
    if (now >= nextResetUTC) {
      nextResetUTC.setDate(nextResetUTC.getDate() + 1)
    }

    // Format in user's local time
    const resetTime = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short',
    }).format(nextResetUTC)

    return `Resets daily at ${resetTime}`
  }

  if (period === 'weekly') {
    // Calculate next Sunday at DAILY_RESET_HOUR_UTC (10am UTC = 5am ET / 2am PT)
    const nextSundayUTC = new Date(now)
    nextSundayUTC.setUTCHours(DAILY_RESET_HOUR_UTC, 0, 0, 0)
    const daysUntilSunday = (7 - nextSundayUTC.getUTCDay()) % 7
    if (daysUntilSunday === 0 && now >= nextSundayUTC) {
      // If it's Sunday and we're past the reset, show next Sunday
      nextSundayUTC.setDate(nextSundayUTC.getDate() + 7)
    } else {
      nextSundayUTC.setDate(nextSundayUTC.getDate() + daysUntilSunday)
    }

    // Format in user's local time
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

export function LeaderboardTable({ leaderboard, isLoading, period }: LeaderboardTableProps) {
  const { user } = useUser()
  const resetDescription = getResetTimeDescription(period)

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {period === 'daily' && "Today's Leaders"}
          {period === 'weekly' && "This Week's Leaders"}
          {period === 'alltime' && 'All-Time Leaders'}
        </CardTitle>
        <CardDescription>{resetDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className='h-96 flex items-center justify-center text-muted-foreground'>Loading leaderboard...</div>
        ) : !leaderboard || leaderboard.length === 0 ? (
          <div className='h-96 flex items-center justify-center text-muted-foreground'>No rankings available yet</div>
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
                  {/* Rank */}
                  <div className='w-12 text-center'>
                    {entry.rank === 1 && <Trophy className='h-6 w-6 mx-auto text-warning' />}
                    {entry.rank === 2 && <Trophy className='h-6 w-6 mx-auto text-gray-400' />}
                    {entry.rank === 3 && <Trophy className='h-6 w-6 mx-auto text-amber-600' />}
                    {entry.rank > 3 && (
                      <span className='text-lg font-semibold text-muted-foreground'>#{entry.rank}</span>
                    )}
                  </div>

                  {/* Avatar & Username */}
                  <Avatar className='h-10 w-10'>
                    {entry.imageUrl && (
                      <AvatarImage src={entry.imageUrl} alt={entry.displayName || entry.username || 'User'} />
                    )}
                    <AvatarFallback>{(entry.displayName || entry.username)?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className='flex-1'>
                    <div className='font-semibold'>
                      {entry.displayName || (entry.username ? entry.username : 'Anonymous')}
                    </div>
                  </div>

                  {/* Rank Change */}
                  {period !== 'alltime' && entry.rankChange !== null && (
                    <div className='flex items-center gap-1'>
                      {entry.rankChange > 0 && (
                        <Badge variant='outline' className='text-success border-success'>
                          <TrendingUp className='h-3 w-3 mr-1' />
                          {entry.rankChange}
                        </Badge>
                      )}
                      {entry.rankChange < 0 && (
                        <Badge variant='outline' className='text-destructive border-destructive'>
                          <TrendingDown className='h-3 w-3 mr-1' />
                          {Math.abs(entry.rankChange)}
                        </Badge>
                      )}
                      {entry.rankChange === 0 && (
                        <Badge variant='outline' className='text-muted-foreground'>
                          <Minus className='h-3 w-3 mr-1' />0
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Points */}
                  <div className='text-right min-w-24'>
                    <div className='text-lg font-bold'>{entry.points.toLocaleString()}</div>
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
