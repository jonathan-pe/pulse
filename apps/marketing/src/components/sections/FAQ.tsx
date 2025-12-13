import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function FAQ() {
  return (
    <section id='faq' className='py-20 sm:py-32'>
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='text-center mb-16'>
          <h2 className='text-3xl sm:text-4xl font-bold mb-4'>Frequently Asked Questions</h2>
          <p className='text-xl text-muted-foreground'>Everything you need to know about Pulse</p>
        </div>

        <div className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Is this sports betting or gambling?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-muted-foreground'>
                <strong>No.</strong> Pulse is not sports betting, gambling, or any form of real-money wagering. No money
                is involved, no prizes are awarded, and no financial transactions occur. We use real sportsbook odds
                only for our point scoring algorithm. This is a free, skill-based prediction platform for entertainment
                and friendly competition.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How are points calculated?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-muted-foreground mb-4'>
                Points are calculated using the implied probability from sportsbook odds. The formula is:
              </p>
              <div className='bg-muted p-4 rounded-lg font-mono text-sm mb-4'>
                Base Points = 10 × (100 / Implied Probability)
              </div>
              <p className='text-muted-foreground'>
                Incorrect predictions can also lose points, scaled by implied probability (missing heavy favorites costs
                more than missing longshot underdogs). This keeps the risk/reward profile balanced across odds ranges.
              </p>
              <div className='bg-muted p-4 rounded-lg font-mono text-sm my-4'>
                Incorrect Points = -LOSS_MULTIPLIER × (Implied Probability / 10)
              </div>
              <p className='text-muted-foreground'>
                Your first prediction each day gets a 1.5x multiplier as a bonus for daily engagement.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What are achievements?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-muted-foreground'>
                Achievements are cosmetic rewards that recognize your accomplishments. You can earn badges for streaks
                (consecutive correct predictions), milestones (total predictions, points earned), accuracy (win rate
                achievements), league expertise, and leaderboard rankings. Showcase up to 5 badges on your profile and
                track your progress in your trophy case. Achievements don't affect point scoring—they're purely for
                bragging rights!
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Can I "game" the system by only picking favorites or underdogs?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-muted-foreground'>
                <strong>No.</strong> The scoring system is designed for balanced expected value across odds ranges.
                Whether you pick heavy favorites, balanced matchups, or longshot underdogs, your expected points per
                pick are the same. The only thing that matters is prediction accuracy. Anti-abuse mechanisms like
                diminishing returns and rate limiting prevent exploitation through volume.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What sports and leagues are supported?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-muted-foreground mb-2'>
                Currently, Pulse supports predictions for these major North American leagues:
              </p>
              <ul className='list-disc list-inside space-y-1 text-muted-foreground'>
                <li>🏈 NFL (National Football League)</li>
                <li>🏀 NBA (National Basketball Association)</li>
                <li>⚾ MLB (Major League Baseball)</li>
                <li>🏒 NHL (National Hockey League)</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What prediction types are available?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-muted-foreground mb-2'>You can make three types of predictions on each game:</p>
              <ul className='list-disc list-inside space-y-1 text-muted-foreground'>
                <li>
                  <strong>Moneyline:</strong> Pick which team will win the game outright
                </li>
                <li>
                  <strong>Point Spread:</strong> Pick which team will cover the spread
                </li>
                <li>
                  <strong>Over/Under (Total):</strong> Pick whether the total points scored will be over or under the
                  line
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How do diminishing returns work?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-muted-foreground'>
                To maintain fair competition and prevent grinding, we use a diminishing returns system: predictions 1-15
                earn 100% of points, predictions 16-40 earn 50% of points, and predictions beyond 40 earn 0 points. This
                resets daily at midnight UTC. You can still make unlimited predictions for fun, but the point earnings
                are reduced after 15 predictions to keep the leaderboards balanced.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Do streaks affect my point scoring?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-muted-foreground'>
                <strong>No.</strong> Streaks are tracked purely for achievements and bragging rights. They don't give
                you point multipliers or bonuses. This keeps the scoring system mathematically fair—your points depend
                only on the implied probability of your picks, not on how many you've gotten right in a row.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Is Pulse free to use?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-muted-foreground'>
                Yes! Pulse is completely free. Create an account, make predictions, earn points, and compete on
                leaderboards without any cost. No subscriptions, no in-app purchases, no hidden fees.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
