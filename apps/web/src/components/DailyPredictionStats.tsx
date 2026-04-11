import { useDailyPredictionStats } from '@/hooks/usePredictions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Target } from 'lucide-react'

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
          Today&apos;s activity
        </CardTitle>
        <CardDescription>Predictions placed since the daily reset</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='flex flex-col gap-1'>
          <div className='flex items-center gap-2 text-muted-foreground text-sm'>
            <Target className='h-4 w-4' />
            <span>Predictions today</span>
          </div>
          <div className='text-2xl font-bold'>{stats.totalToday}</div>
        </div>
      </CardContent>
    </Card>
  )
}
