import { useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import { createFileRoute } from '@tanstack/react-router'
import { useLeaderboard } from '@/hooks/usePoints'
import { LeaderboardTable } from '@/components/leaderboard/LeaderboardTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { LeaderboardPeriod } from '@pulse/types'

export const Route = createFileRoute('/_authenticated/leaderboard')({
  component: Leaderboard,
})

function Leaderboard() {
  const { user } = useUser()
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

        <LeaderboardTable leaderboard={leaderboard} isLoading={isLoading} period={period} />
      </div>
    </div>
  )
}
