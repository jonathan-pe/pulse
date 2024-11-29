// app/components/GameCard.tsx
import { Card, CardContent } from '@/app/components/ui/card'
import useCart from '@/app/hooks/use-cart'
import { Game } from '@/types/game'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import OddCard from './odd-card'
import { useAppStore } from '@/app/store'

interface GameCardProps {
  game: Game
  sportsbookID?: string
  selectable?: boolean
}

export default function GameCard({ game, sportsbookID, selectable }: GameCardProps) {
  const { teams, sportsbooks } = game
  const sportsbook = sportsbooks.find((sb) => sb.id === sportsbookID)

  const setGame = useAppStore((state) => state.setGame)

  const { cart, addToCart, removeFromCart } = useCart()

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

  const mainSpreads = game.sportsbooks
    .find((sb) => sb.id === sportsbookID)
    ?.odds.filter((odd) => odd.market === 'Point Spread' && odd.main)
  const homeSpread = mainSpreads?.find((spread) => spread.selection === 'Home')
  const awaySpread = mainSpreads?.find((spread) => spread.selection === 'Away')

  const mainTotals = game.sportsbooks
    .find((sb) => sb.id === sportsbookID)
    ?.odds.filter((odd) => odd.market === 'Total Points' && odd.main)
  const overTotal = mainTotals?.find((total) => total.selection === 'Over')
  const underTotal = mainTotals?.find((total) => total.selection === 'Under')

  const mainMoneylines = game.sportsbooks
    .find((sb) => sb.id === sportsbookID)
    ?.odds.filter((odd) => odd.market === 'Moneyline' && odd.main)
  const homeMoneyline = mainMoneylines?.find((moneyLine) => moneyLine.selection === 'Home')
  const awayMoneyline = mainMoneylines?.find((moneyLine) => moneyLine.selection === 'Away')

  const homeTeamName = `${teams.home.abbreviation} ${teams.home.name.split(' ').pop()}`
  const awayTeamName = `${teams.away.abbreviation} ${teams.away.name.split(' ').pop()}`

  return (
    <Link
      href={selectable ? `${usePathname()}/${game.id}` : ''}
      className={!selectable ? 'cursor-default' : ''}
      onClick={() => setGame(game)}
    >
      <Card className={`${selectable && 'cursor-pointer hover:bg-muted'}`}>
        <CardContent className='px-6 py-4'>
          <div className='grid gap-4'>
            <div className='grid grid-cols-5 gap-4'>
              <div className='col-span-2'>{localStartTime}</div>
              <div className='flex justify-center text-muted-foreground'>Spread</div>
              <div className='flex justify-center text-muted-foreground'>Over/Under</div>
              <div className='flex justify-center text-muted-foreground'>Money</div>
            </div>

            <div className='grid grid-cols-5 gap-4'>
              <div className='col-span-2 flex items-center font-bold text-xl'>
                {teams.away.abbreviation} {teams.away.name.split(' ').pop()}
              </div>
              <OddCard odd={awaySpread} event={`${awayTeamName} @ ${homeTeamName}`} />
              <OddCard odd={overTotal} event={`${awayTeamName} @ ${homeTeamName}`} />
              <OddCard odd={awayMoneyline} event={`${awayTeamName} @ ${homeTeamName}`} />
            </div>

            <div className='grid grid-cols-5 gap-4'>
              <div className='col-span-2 flex items-center font-bold text-xl'>
                {teams.home.abbreviation} {teams.home.name.split(' ').pop()}
              </div>
              <OddCard odd={homeSpread} event={`${awayTeamName} @ ${homeTeamName}`} />
              <OddCard odd={underTotal} event={`${awayTeamName} @ ${homeTeamName}`} />
              <OddCard odd={homeMoneyline} event={`${awayTeamName} @ ${homeTeamName}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
