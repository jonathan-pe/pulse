// app/components/GameCard.tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/app/components/ui/card'
import { Game } from '@/types/game'

export default function GameCard({ game, sportsbookID }: { game: Game; sportsbookID?: string }) {
  const { teams, sportsbooks } = game
  const sportsbook = sportsbooks.find((sb) => sb.id === sportsbookID)

  if (!sportsbook) return null

  const utcDate = new Date(`${game.start}Z`)
  const localStartTime = utcDate.toLocaleString(undefined, {
    // TODO: maybe remove date once we do more testing
    // year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    timeZoneName: 'short', // TODO: remove once we test other time zones
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {teams.away.name} @ {teams.home.name}
        </CardTitle>
        <CardDescription>{localStartTime}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='flex justify-between'>
          <div>
            <h3 className='font-bold'>Team A</h3>
            <p>
              {teams.home.name} ({teams.home.abbreviation})
            </p>
          </div>
          <div>
            <h3 className='font-bold'>Team B</h3>
            <p>
              {teams.away.name} ({teams.away.abbreviation})
            </p>
          </div>
        </div>
        <div className='mt-4'>
          <h4 className='font-bold'>Odds</h4>
          <ul>
            {sportsbook.odds.map((odd) => (
              <li key={odd.id} className='mt-2'>
                <p>Market: {odd.market}</p>
                <p>Selection: {odd.selection}</p>
                <p>Price: {odd.price}</p>
                {odd.points !== null && <p>Points: {odd.points}</p>}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
      <CardFooter>
        <p>Additional game information can go here.</p>
      </CardFooter>
    </Card>
  )
}
