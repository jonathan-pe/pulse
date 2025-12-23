import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle } from 'lucide-react'

export function HowItWorks() {
  return (
    <section id='how-it-works' className='py-20 sm:py-32 bg-muted/30'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='text-center mb-16'>
          <h2 className='text-3xl sm:text-4xl font-bold mb-4'>How Does This Thing Work?</h2>
          <p className='text-xl text-muted-foreground max-w-2xl mx-auto'>Four steps. That's it.</p>
        </div>

        <div className='grid md:grid-cols-2 gap-8 mb-16'>
          {/* Step 1 with Image */}
          <div className='relative rounded-xl overflow-hidden border bg-card shadow-lg'>
            <img src='/how-it-works/scout-the-games.jpg' alt='Basketball arena' className='w-full h-48 object-cover' />
            <div className='p-6'>
              <div className='inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground text-xl font-bold mb-3'>
                1
              </div>
              <h3 className='text-xl font-semibold mb-2'>Scout the Games</h3>
              <p className='text-muted-foreground'>Browse games. Check odds. Find your moment.</p>
            </div>
          </div>

          {/* Step 2 with Image */}
          <div className='relative rounded-xl overflow-hidden border bg-card shadow-lg'>
            <img
              src='/how-it-works/call-your-shot.jpg'
              alt='Laptop with sports stats'
              className='w-full h-48 object-cover'
            />
            <div className='p-6'>
              <div className='inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground text-xl font-bold mb-3'>
                2
              </div>
              <h3 className='text-xl font-semibold mb-2'>Call Your Shot</h3>
              <p className='text-muted-foreground'>Pick winners, spreads, or totals. Odds lock in. No take-backs.</p>
            </div>
          </div>

          {/* Step 3 with Image */}
          <div className='relative rounded-xl overflow-hidden border bg-card shadow-lg'>
            <img
              src='/how-it-works/sweat-the-game.jpg'
              alt='Watching sports on TV'
              className='w-full h-48 object-cover'
            />
            <div className='p-6'>
              <div className='inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground text-xl font-bold mb-3'>
                3
              </div>
              <h3 className='text-xl font-semibold mb-2'>Sweat the Game</h3>
              <p className='text-muted-foreground'>Watch it play out. Auto-scores when it ends.</p>
            </div>
          </div>

          {/* Step 4 with Image */}
          <div className='relative rounded-xl overflow-hidden border bg-card shadow-lg'>
            <img
              src='/how-it-works/stack-your-points.jpg'
              alt='Champions trophy'
              className='w-full h-48 object-cover'
            />
            <div className='p-6'>
              <div className='inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground text-xl font-bold mb-3'>
                4
              </div>
              <h3 className='text-xl font-semibold mb-2'>Stack Your Points</h3>
              <p className='text-muted-foreground'>Hit it? Points up. Miss it? Points down. Climb that board.</p>
            </div>
          </div>
        </div>

        <div className='mt-16 max-w-2xl mx-auto'>
          <Card>
            <CardHeader>
              <CardTitle>The Math (Super Simple)</CardTitle>
              <CardDescription>Harder picks = more points</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div className='p-4 bg-muted rounded-lg'>
                  <div className='flex justify-between items-center mb-2'>
                    <span className='font-semibold'>Pick favorite (-200)</span>
                    <Badge variant='secondary'>Safe</Badge>
                  </div>
                  <p className='text-sm font-semibold text-primary'>✅ Win: +15 pts</p>
                  <p className='text-sm font-semibold text-destructive'>❌ Lose: -3 pts</p>
                </div>

                <div className='p-4 bg-muted rounded-lg'>
                  <div className='flex justify-between items-center mb-2'>
                    <span className='font-semibold'>Pick underdog (+300)</span>
                    <Badge variant='secondary'>Risky</Badge>
                  </div>
                  <p className='text-sm font-semibold text-primary'>✅ Win: +40 pts</p>
                  <p className='text-sm font-semibold text-destructive'>❌ Lose: -1 pt</p>
                </div>

                <div className='flex items-start gap-2 p-4 border-l-4 border-primary bg-primary/5 rounded'>
                  <AlertCircle className='h-5 w-5 text-primary shrink-0 mt-0.5' />
                  <p className='text-sm'>
                    <strong>Your choice:</strong> Small safe wins or big risky shots. Both work if you're good.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
