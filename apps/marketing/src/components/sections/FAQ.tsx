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
                <strong>Nope.</strong> Zero money. Zero prizes. Just points, leaderboards, and bragging rights.
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
              <CardTitle>Can I spam picks to win?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-muted-foreground'>
                <strong>Nope.</strong> Anti-spam kicks in after 15 picks. Skill matters, not volume.
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
