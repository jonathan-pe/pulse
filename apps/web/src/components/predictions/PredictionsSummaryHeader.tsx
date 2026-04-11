import { useUserStats } from '@/hooks/usePoints'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Target, Flame, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DEFAULT_STREAK_HIGHLIGHT_THRESHOLD } from '@pulse/shared'

const STREAK_HIGHLIGHT_THRESHOLD = DEFAULT_STREAK_HIGHLIGHT_THRESHOLD

export function PredictionsSummaryHeader() {
  const { data: stats, isLoading } = useUserStats()

  if (isLoading) {
    return (
      <Card>
        <CardContent className='pt-6'>
          <p className='text-sm text-muted-foreground'>Loading stats...</p>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return null
  }

  const winRatePercent = (stats.overallWinRate * 100).toFixed(1)

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <TrendingUp className='h-5 w-5' />
          Your Prediction Performance
        </CardTitle>
        <CardDescription>Track your predictions and see how they impact your score</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-2 sm:grid-cols-3 gap-4'>
          {/* Points Earned Today */}
          <div className='flex flex-col gap-1'>
            <div className='flex items-center gap-2 text-muted-foreground text-sm'>
              <Calendar className='h-4 w-4' />
              <span>Points Today</span>
            </div>
            <div className='text-2xl font-bold'>{stats.pointsEarnedToday}</div>
            <div className='text-xs text-muted-foreground'>{stats.predictionsToday} predictions made</div>
          </div>

          {/* Win Rate */}
          <div className='flex flex-col gap-1'>
            <div className='flex items-center gap-2 text-muted-foreground text-sm'>
              <Target className='h-4 w-4' />
              <span>Win Rate</span>
            </div>
            <div className='text-2xl font-bold'>{winRatePercent}%</div>
            <div className='text-xs text-muted-foreground'>
              {stats.correctPredictions} of {stats.totalPredictions} correct
            </div>
          </div>

          {/* Current Streak */}
          <div className='flex flex-col gap-1'>
            <div className='flex items-center gap-2 text-muted-foreground text-sm'>
              <Flame className={cn('h-4 w-4', stats.currentStreak >= STREAK_HIGHLIGHT_THRESHOLD && 'text-warning')} />
              <span>Streak</span>
            </div>
            <div
              className={cn('text-2xl font-bold', stats.currentStreak >= STREAK_HIGHLIGHT_THRESHOLD && 'text-warning')}
            >
              {stats.currentStreak}
            </div>
            <div className='text-xs text-muted-foreground'>Best: {stats.longestStreak}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
