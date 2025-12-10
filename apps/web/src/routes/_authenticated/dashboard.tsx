import { createFileRoute } from '@tanstack/react-router'
import { useUserStats } from '@/hooks/usePoints'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { LeagueStatsTable } from '@/components/dashboard/LeagueStatsTable'
import { PointsChart } from '@/components/dashboard/PointsChart'
import { RecentPredictions } from '@/components/dashboard/RecentPredictions'
import { TrendingUp, Target, Award, Flame, Calendar, Trophy } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'
import { DEFAULT_DAILY_BONUS_TIER_LIMIT } from '@pulse/shared'

const DAILY_BONUS_TIER_LIMIT = DEFAULT_DAILY_BONUS_TIER_LIMIT

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: Dashboard,
})

function Dashboard() {
  const { data: stats, isLoading } = useUserStats()

  if (isLoading) {
    return (
      <div className='w-full h-full overflow-y-auto'>
        <div className='container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8'>
          <div className='flex items-center justify-center h-96'>
            <div className='text-muted-foreground'>Loading dashboard...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className='w-full h-full overflow-y-auto'>
        <div className='container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8'>
          <Card className='p-8 text-center'>
            <TrendingUp className='h-12 w-12 mx-auto mb-4 text-muted-foreground' />
            <h3 className='text-lg font-semibold mb-2'>Start Your Prediction Journey</h3>
            <p className='text-muted-foreground mb-4'>Make your first prediction to start earning points!</p>
            <Button asChild>
              <Link to='/'>Browse Games</Link>
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  const winRatePercent = (stats.overallWinRate * 100).toFixed(1)
  const todayBonusRemaining = DAILY_BONUS_TIER_LIMIT - stats.bonusTierUsed

  return (
    <div className='w-full h-full overflow-y-auto'>
      <div className='container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8'>
        {/* Header */}
        <div className='mb-6 sm:mb-8'>
          <h1 className='text-2xl sm:text-3xl font-bold mb-2'>Dashboard</h1>
          <p className='text-muted-foreground'>Track your performance and progress</p>
        </div>

        {/* Stats Grid */}
        <div className='grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6 sm:mb-8'>
          <StatsCard
            title='Total Points'
            value={stats.totalPoints.toLocaleString()}
            description={stats.leaderboardRank ? `Rank #${stats.leaderboardRank} on leaderboard` : 'Unranked'}
            icon={TrendingUp}
          />

          <StatsCard
            title='Win Rate'
            value={`${winRatePercent}%`}
            description={`${stats.correctPredictions} of ${stats.totalPredictions} correct`}
            icon={Target}
          />

          <StatsCard
            title='Current Streak'
            value={stats.currentStreak}
            description={`Longest: ${stats.longestStreak} in a row`}
            icon={Flame}
            className={stats.currentStreak >= 3 ? 'border-orange-500/50' : ''}
          />

          <StatsCard
            title="Today's Predictions"
            value={stats.predictionsToday}
            description={`${todayBonusRemaining} bonus ${todayBonusRemaining === 1 ? 'pick' : 'picks'} remaining`}
            icon={Calendar}
          />

          <StatsCard title='Points Earned Today' value={stats.pointsEarnedToday} icon={Award} />

          <StatsCard
            title='Leaderboard Rank'
            value={stats.leaderboardRank ?? 'Unranked'}
            description={stats.leaderboardRank ? 'All-time ranking' : 'Make predictions to get ranked'}
            icon={Trophy}
          />
        </div>

        {/* Charts and Tables */}
        <div className='grid gap-6 lg:grid-cols-2 mb-6 sm:mb-8'>
          <PointsChart data={stats.pointsOverTime} isLoading={isLoading} />
          <LeagueStatsTable stats={stats.byLeague} isLoading={isLoading} />
        </div>

        {/* Recent Predictions */}
        <div className='mb-6 sm:mb-8'>
          <RecentPredictions />
        </div>

        {/* Quick Actions */}
        <Card>
          <CardContent className='p-6'>
            <h3 className='font-semibold mb-4'>Quick Actions</h3>
            <div className='flex flex-wrap gap-3'>
              <Button asChild>
                <Link to='/'>Make Predictions</Link>
              </Button>
              <Button variant='outline' asChild>
                <Link to='/leaderboard'>View Leaderboard</Link>
              </Button>
              <Button variant='outline' asChild>
                <Link to='/predictions'>My Predictions</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
