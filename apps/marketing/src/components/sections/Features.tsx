import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Target, Zap, Award, Trophy, TrendingUp, Shield, CheckCircle2 } from 'lucide-react'

export function Features() {
  return (
    <section id='features' className='py-20 sm:py-32'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='text-center mb-16'>
          <h2 className='text-3xl sm:text-4xl font-bold mb-4'>Why Choose Pulse?</h2>
          <p className='text-xl text-muted-foreground max-w-2xl mx-auto'>
            Fair, transparent, and built for sports fans who love the challenge of making predictions
          </p>
        </div>

        <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8'>
          {/* Probability-Based Scoring */}
          <Card>
            <CardHeader>
              <Target className='h-10 w-10 text-primary mb-2' />
              <CardTitle>Probability-Based Scoring</CardTitle>
              <CardDescription>
                Points scale with implied probability from real sportsbook odds. Picking a 75% favorite earns 13 points,
                while a 12.5% longshot earns 80 points—both have equal expected value.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-2 text-sm'>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>-200 (67% favorite):</span>
                  <span className='font-semibold'>15 points</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>+150 (40% underdog):</span>
                  <span className='font-semibold'>25 points</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>+300 (25% underdog):</span>
                  <span className='font-semibold'>40 points</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily Bonus Multiplier */}
          <Card>
            <CardHeader>
              <Zap className='h-10 w-10 text-primary mb-2' />
              <CardTitle>Daily Bonus Multiplier</CardTitle>
              <CardDescription>
                Your first prediction each day receives a 1.5x point multiplier. Make unlimited predictions after that
                with baseline scoring. Return daily to maximize your points!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-2 text-sm'>
                <div className='flex items-center gap-2'>
                  <CheckCircle2 className='h-4 w-4 text-primary' />
                  <span>First pick: 1.5x multiplier</span>
                </div>
                <div className='flex items-center gap-2'>
                  <CheckCircle2 className='h-4 w-4 text-primary' />
                  <span>Unlimited predictions available</span>
                </div>
                <div className='flex items-center gap-2'>
                  <CheckCircle2 className='h-4 w-4 text-primary' />
                  <span>Resets daily at midnight UTC</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Achievements System */}
          <Card>
            <CardHeader>
              <Award className='h-10 w-10 text-primary mb-2' />
              <CardTitle>Unlock Achievements</CardTitle>
              <CardDescription>
                Earn cosmetic badges for milestones, streaks, accuracy, and league expertise. Showcase your best
                achievements on your profile and build your trophy case.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='flex flex-wrap gap-2'>
                <Badge variant='outline'>🔥 5 Streak</Badge>
                <Badge variant='outline'>🎯 75% Win Rate</Badge>
                <Badge variant='outline'>⚡ 100 Predictions</Badge>
                <Badge variant='outline'>🏆 Top 10</Badge>
                <Badge variant='outline'>🏈 NFL Expert</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Leaderboards */}
          <Card>
            <CardHeader>
              <Trophy className='h-10 w-10 text-primary mb-2' />
              <CardTitle>Compete on Leaderboards</CardTitle>
              <CardDescription>
                Climb daily, weekly, and all-time leaderboards. Track your rank, see how you stack up against others,
                and compete for the top spots through pure prediction accuracy.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-2 text-sm'>
                <div className='flex items-center gap-2'>
                  <CheckCircle2 className='h-4 w-4 text-primary' />
                  <span>Daily leaderboard</span>
                </div>
                <div className='flex items-center gap-2'>
                  <CheckCircle2 className='h-4 w-4 text-primary' />
                  <span>Weekly leaderboard</span>
                </div>
                <div className='flex items-center gap-2'>
                  <CheckCircle2 className='h-4 w-4 text-primary' />
                  <span>All-time leaderboard</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Multi-Sport Coverage */}
          <Card>
            <CardHeader>
              <TrendingUp className='h-10 w-10 text-primary mb-2' />
              <CardTitle>Multi-Sport Coverage</CardTitle>
              <CardDescription>
                Make predictions across NFL, NBA, MLB, and NHL. Real-time odds integration with professional team
                branding, logos, and comprehensive game data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='flex flex-wrap gap-2'>
                <Badge>🏈 NFL</Badge>
                <Badge>🏀 NBA</Badge>
                <Badge>⚾ MLB</Badge>
                <Badge>🏒 NHL</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Fair Competition */}
          <Card>
            <CardHeader>
              <Shield className='h-10 w-10 text-primary mb-2' />
              <CardTitle>Fair Competition</CardTitle>
              <CardDescription>
                Anti-abuse mechanisms prevent exploitation. Mathematically equal expected value across all strategies
                means you can't "game" the system—only prediction accuracy matters.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-2 text-sm'>
                <div className='flex items-center gap-2'>
                  <CheckCircle2 className='h-4 w-4 text-primary' />
                  <span>Diminishing returns prevent grinding</span>
                </div>
                <div className='flex items-center gap-2'>
                  <CheckCircle2 className='h-4 w-4 text-primary' />
                  <span>Bot detection & rate limiting</span>
                </div>
                <div className='flex items-center gap-2'>
                  <CheckCircle2 className='h-4 w-4 text-primary' />
                  <span>Transparent scoring algorithm</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
