import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function FAQ() {
  return (
    <section id='faq' className='py-20 sm:py-32'>
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='text-center mb-16'>
          <h2 className='text-3xl sm:text-4xl font-bold mb-4'>Got Questions?</h2>
          <p className='text-xl text-muted-foreground'>Quick answers to the important stuff</p>
        </div>

        <div className='grid md:grid-cols-2 gap-6'>
          <Card>
            <CardHeader>
              <CardTitle>Wait, is this gambling?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-muted-foreground'>
                <strong>Nope.</strong> Zero money. Zero prizes—just points, streaks, achievements, and optional
                community rankings for context.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How much does it cost?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-muted-foreground'>
                <strong>Free.</strong> No subscriptions. No fees. No "unlock premium" BS.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Which sports?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-muted-foreground'>🏈 NFL • 🏀 NBA • ⚾ MLB • 🏒 NHL</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What can I predict?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-muted-foreground'>
                <strong>Moneyline</strong> (winners), <strong>Spread</strong> (covers), <strong>Over/Under</strong>{' '}
                (totals)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Does picking more games weaken my points?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-muted-foreground'>
                <strong>Correct picks don&apos;t get weaker because you picked a lot.</strong> Scoring is odds-based,
                not volume-penalized. We may add rate limits later to keep the service healthy.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How do points work?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-muted-foreground'>
                Harder picks = more points. Win big on longshots, lose less when wrong. Math keeps it fair.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
