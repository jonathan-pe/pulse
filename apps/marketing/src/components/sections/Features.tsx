import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Target, Zap, Award, Trophy, CheckCircle2 } from 'lucide-react'

export function Features() {
  return (
    <section id='features' className='py-20 sm:py-32'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='text-center mb-16'>
          <h2 className='text-3xl sm:text-4xl font-bold mb-4'>What Makes This Awesome?</h2>
          <p className='text-xl text-muted-foreground max-w-2xl mx-auto'>You vs. the numbers. Let's go.</p>
        </div>

        {/* Main Visual Feature with Image */}
        <div className='mb-16 rounded-2xl overflow-hidden border bg-card shadow-lg'>
          <div className='grid md:grid-cols-2 gap-0'>
            <div className='relative h-64 md:h-auto'>
              <img
                src='/features/climb-the-ranks.jpg'
                alt='Leaderboard competition'
                className='w-full h-full object-cover'
              />
            </div>
            <div className='p-8 flex flex-col justify-center'>
              <Trophy className='h-12 w-12 text-primary mb-4' />
              <h3 className='text-2xl font-bold mb-3'>Climb the Ranks</h3>
              <p className='text-muted-foreground text-lg mb-4'>
                Daily, weekly, all-time—there's always someone to chase. Prove you're the best.
              </p>
              <div className='flex gap-2'>
                <Badge>🔥 Daily</Badge>
                <Badge>💪 Weekly</Badge>
                <Badge>👑 All-Time</Badge>
              </div>
            </div>
          </div>
        </div>

        <div className='grid md:grid-cols-3 gap-8'>
          {/* Probability-Based Scoring */}
          <Card>
            <CardHeader>
              <Target className='h-10 w-10 text-primary mb-2' />
              <CardTitle>Risk It, Earn It</CardTitle>
              <CardDescription>Safe bet = small reward. Longshot = huge points. Your call.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-2 text-sm'>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Safe (-200):</span>
                  <span className='font-semibold'>+15 pts</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Underdog (+150):</span>
                  <span className='font-semibold'>+25 pts</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Longshot (+300):</span>
                  <span className='font-semibold'>+40 pts 🔥</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily Bonus Multiplier */}
          <Card>
            <CardHeader>
              <Zap className='h-10 w-10 text-primary mb-2' />
              <CardTitle>Daily Power Pick</CardTitle>
              <CardDescription>First pick each day gets 1.5x boost. Then play unlimited.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-2 text-sm'>
                <div className='flex items-center gap-2'>
                  <CheckCircle2 className='h-4 w-4 text-primary' />
                  <span>1st pick: 1.5x BOOST ⚡</span>
                </div>
                <div className='flex items-center gap-2'>
                  <CheckCircle2 className='h-4 w-4 text-primary' />
                  <span>Unlimited after</span>
                </div>
                <div className='flex items-center gap-2'>
                  <CheckCircle2 className='h-4 w-4 text-primary' />
                  <span>Resets daily</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Achievements System */}
          <Card>
            <CardHeader>
              <Award className='h-10 w-10 text-primary mb-2' />
              <CardTitle>Flex Your Trophies</CardTitle>
              <CardDescription>Collect badges. Show off. Brag.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='flex flex-wrap gap-2'>
                <Badge variant='outline'>🔥 5 Streak</Badge>
                <Badge variant='outline'>🎯 75% Win Rate</Badge>
                <Badge variant='outline'>⚡ 100 Picks</Badge>
                <Badge variant='outline'>🏆 Top 10</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
