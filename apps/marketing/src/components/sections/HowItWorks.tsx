import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle } from 'lucide-react'

export function HowItWorks() {
  return (
    <section id='how-it-works' className='py-20 sm:py-32 bg-muted/30'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='text-center mb-16'>
          <h2 className='text-3xl sm:text-4xl font-bold mb-4'>How It Works</h2>
          <p className='text-xl text-muted-foreground max-w-2xl mx-auto'>
            Simple, transparent, and designed for sports fans
          </p>
        </div>

        <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-8'>
          <div className='text-center'>
            <div className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold mb-4'>
              1
            </div>
            <h3 className='text-xl font-semibold mb-2'>Browse Games</h3>
            <p className='text-muted-foreground'>
              View upcoming games across NFL, NBA, MLB, and NHL with real-time sportsbook odds
            </p>
          </div>

          <div className='text-center'>
            <div className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold mb-4'>
              2
            </div>
            <h3 className='text-xl font-semibold mb-2'>Make Predictions</h3>
            <p className='text-muted-foreground'>
              Pick moneyline winners, spreads, or over/under totals. Odds are captured at prediction time
            </p>
          </div>

          <div className='text-center'>
            <div className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold mb-4'>
              3
            </div>
            <h3 className='text-xl font-semibold mb-2'>Games Resolve</h3>
            <p className='text-muted-foreground'>
              Wait for games to finish. Results are automatically scored based on official game outcomes
            </p>
          </div>

          <div className='text-center'>
            <div className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold mb-4'>
              4
            </div>
            <h3 className='text-xl font-semibold mb-2'>Earn Points</h3>
            <p className='text-muted-foreground'>
              Correct predictions earn points and incorrect predictions can lose points—both based on implied
              probability
            </p>
          </div>
        </div>

        <div className='mt-16 max-w-3xl mx-auto'>
          <Card>
            <CardHeader>
              <CardTitle>Point Calculation Example</CardTitle>
              <CardDescription>Here's how the probability-based scoring formula works in practice</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div className='p-4 bg-muted rounded-lg'>
                  <div className='flex justify-between items-start mb-2'>
                    <span className='font-semibold'>Scenario: Pick the favorite at -200 odds</span>
                    <Badge variant='secondary'>67% Win Probability</Badge>
                  </div>
                  <p className='text-sm text-muted-foreground mb-2'>
                    Formula: Base Points = 10 × (100 / Implied Probability)
                  </p>
                  <p className='text-sm text-muted-foreground mb-2'>Calculation: 10 × (100 / 67) = 15 points</p>
                  <p className='text-sm font-semibold text-primary'>✓ If correct: +15 points (or +22 with bonus)</p>
                  <p className='text-sm font-semibold text-destructive mt-1'>✗ If incorrect: -3.3 points</p>
                </div>

                <div className='p-4 bg-muted rounded-lg'>
                  <div className='flex justify-between items-start mb-2'>
                    <span className='font-semibold'>Scenario: Pick the underdog at +300 odds</span>
                    <Badge variant='secondary'>25% Win Probability</Badge>
                  </div>
                  <p className='text-sm text-muted-foreground mb-2'>
                    Formula: Base Points = 10 × (100 / Implied Probability)
                  </p>
                  <p className='text-sm text-muted-foreground mb-2'>Calculation: 10 × (100 / 25) = 40 points</p>
                  <p className='text-sm font-semibold text-primary'>✓ If correct: +40 points (or +60 with bonus)</p>
                  <p className='text-sm font-semibold text-destructive mt-1'>✗ If incorrect: -1.25 points</p>
                </div>

                <div className='flex items-start gap-2 p-4 border-l-4 border-primary bg-primary/5 rounded'>
                  <AlertCircle className='h-5 w-5 text-primary shrink-0 mt-0.5' />
                  <p className='text-sm'>
                    <strong>Balanced by design:</strong> Favorites earn fewer points when correct but lose more when
                    wrong; underdogs earn more when correct but lose less when wrong. This keeps different strategies
                    competitive and rewards prediction accuracy.
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
