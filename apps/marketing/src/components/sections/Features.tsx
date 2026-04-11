import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Target, Award, Users, CheckCircle2, Scale } from 'lucide-react'

export function Features() {
  return (
    <section id='features' className='py-20 sm:py-32'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='text-center mb-16'>
          <h2 className='text-3xl sm:text-4xl font-bold mb-4'>What Makes This Awesome?</h2>
          <p className='text-xl text-muted-foreground max-w-2xl mx-auto'>You vs. the odds. We keep the rules simple.</p>
        </div>

        {/* Main Visual Feature with Image */}
        <div className='mb-16 rounded-2xl overflow-hidden border bg-card shadow-lg'>
          <div className='grid md:grid-cols-2 gap-0'>
            <div className='relative h-64 md:h-auto'>
              <img
                src='/features/climb-the-ranks.jpg'
                alt='People following sports together'
                className='w-full h-full object-cover'
              />
            </div>
            <div className='p-8 flex flex-col justify-center'>
              <Users className='h-12 w-12 text-primary mb-4' />
              <h3 className='text-2xl font-bold mb-3'>Community, not a podium</h3>
              <p className='text-muted-foreground text-lg mb-4'>
                See how other predictors are doing over daily, weekly, or all-time windows—helpful context, not the
                main scoreboard for your week.
              </p>
              <div className='flex gap-2'>
                <Badge>Today</Badge>
                <Badge>This week</Badge>
                <Badge>All time</Badge>
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
              <CardDescription>Safe bet = smaller reward. Longshot = bigger reward. Your call.</CardDescription>
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
                  <span className='font-semibold'>+40 pts</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fair rules */}
          <Card>
            <CardHeader>
              <Scale className='h-10 w-10 text-primary mb-2' />
              <CardTitle>Same rules every pick</CardTitle>
              <CardDescription>No bonus tiers or volume penalties on wins—points follow the odds.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-2 text-sm'>
                <div className='flex items-center gap-2'>
                  <CheckCircle2 className='h-4 w-4 text-primary' />
                  <span>Wins: implied-probability scoring</span>
                </div>
                <div className='flex items-center gap-2'>
                  <CheckCircle2 className='h-4 w-4 text-primary' />
                  <span>Losses: scaled by the same math</span>
                </div>
                <div className='flex items-center gap-2'>
                  <CheckCircle2 className='h-4 w-4 text-primary' />
                  <span>What you see is what we score</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Achievements System */}
          <Card>
            <CardHeader>
              <Award className='h-10 w-10 text-primary mb-2' />
              <CardTitle>Achievements & streaks</CardTitle>
              <CardDescription>Cosmetic goals—badges and streaks don&apos;t multiply your points.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='flex flex-wrap gap-2'>
                <Badge variant='outline'>5 streak</Badge>
                <Badge variant='outline'>75% win rate</Badge>
                <Badge variant='outline'>100 picks</Badge>
                <Badge variant='outline'>League milestones</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
