import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useLeaderboard } from '@/hooks/usePoints'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { LeaderboardPeriod } from '@pulse/types'

export const Route = createFileRoute('/_authenticated/leaderboard')({
  component: Leaderboard,
})

function Leaderboard() {
  const [period, setPeriod] = useState<LeaderboardPeriod>('alltime')
  const { data: leaderboard, isLoading } = useLeaderboard(period, 50)

  const periodOptions: { value: LeaderboardPeriod; label: string }[] = [
    { value: 'daily', label: 'Today' },
    { value: 'weekly', label: 'This Week' },
    { value: 'alltime', label: 'All Time' },
  ]

  return (
    <div className='w-full h-full overflow-y-auto'>
      <div className='container max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8'>
        {/* Header */}
        <div className='mb-6 sm:mb-8'>
          <h1 className='text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-3'>
            <Trophy className='h-6 w-6 sm:h-8 sm:w-8 text-warning' />
            Leaderboard
          </h1>
          <p className='text-muted-foreground'>See how you stack up against other predictors</p>
        </div>

        {/* Period Filter */}
        <div className='flex gap-2 mb-6'>
          {periodOptions.map((option) => (
            <Button
              key={option.value}
              variant={period === option.value ? 'default' : 'outline'}
              size='sm'
              onClick={() => setPeriod(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>

        {/* Leaderboard Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              {period === 'daily' && "Today's Leaders"}
              {period === 'weekly' && "This Week's Leaders"}
              {period === 'alltime' && 'All-Time Leaders'}
            </CardTitle>
            <CardDescription>
              {period === 'daily' && 'Points earned since midnight UTC'}
              {period === 'weekly' && 'Points earned since Sunday 00:00 UTC'}
              {period === 'alltime' && 'Total points earned all-time'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className='h-96 flex items-center justify-center text-muted-foreground'>Loading leaderboard...</div>
            ) : !leaderboard || leaderboard.length === 0 ? (
              <div className='h-96 flex items-center justify-center text-muted-foreground'>
                No rankings available yet
              </div>
            ) : (
              <div className='space-y-3'>
                {leaderboard.map((entry) => (
                  <div
                    key={entry.userId}
                    className='flex items-center gap-4 p-3 rounded-lg border hover:bg-accent/50 transition-colors'
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
                      {entry.imageUrl && <AvatarImage src={entry.imageUrl} alt={entry.username || 'User'} />}
                      <AvatarFallback>{entry.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className='flex-1'>
                      <div className='font-semibold'>{entry.username || 'Anonymous'}</div>
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
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
