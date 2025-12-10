import { useDailyPredictionStats } from '@/hooks/usePredictions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Award, Target } from 'lucide-react'
import { DEFAULT_DAILY_TOTAL_LIMIT } from '@pulse/shared'

const DAILY_TOTAL_LIMIT = DEFAULT_DAILY_TOTAL_LIMIT

export function DailyPredictionStats() {
  const { data: stats, isLoading } = useDailyPredictionStats()

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <TrendingUp className='h-5 w-5' />
          Today's Progress
        </CardTitle>
        <CardDescription>Your prediction activity for today</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-2 gap-4'>
          {/* Total predictions today */}
          <div className='flex flex-col gap-1'>
            <div className='flex items-center gap-2 text-muted-foreground text-sm'>
              <Target className='h-4 w-4' />
              <span>Predictions Made</span>
            </div>
            <div className='text-2xl font-bold'>{stats.totalToday}</div>
            <div className='text-xs text-muted-foreground'>{stats.totalRemaining} remaining today</div>
          </div>

          {/* Bonus predictions info - only show if user understands the system */}
          <div className='flex flex-col gap-1'>
            <div className='flex items-center gap-2 text-muted-foreground text-sm'>
              <Award className='h-4 w-4' />
              <span>Daily Limit</span>
            </div>
            <div className='text-2xl font-bold'>{DAILY_TOTAL_LIMIT}</div>
            <div className='text-xs text-muted-foreground'>Max predictions per day</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className='mt-4'>
          <div className='flex items-center justify-between text-xs text-muted-foreground mb-1'>
            <span>Daily Progress</span>
            <span>
              {stats.totalToday}/{DAILY_TOTAL_LIMIT}
            </span>
          </div>
          <div className='w-full bg-secondary rounded-full h-2'>
            <div
              className='bg-primary h-2 rounded-full transition-all duration-300'
              style={{ width: `${Math.min((stats.totalToday / DAILY_TOTAL_LIMIT) * 100, 100)}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
