// app/components/GameCard.tsx
import { Card, CardContent } from '@/app/components/ui/card'
import useCart from '@/app/hooks/use-cart'
import { Game } from '@/types/game'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function GameCard({ game, sportsbookID }: { game: Game; sportsbookID?: string }) {
  const { teams, sportsbooks } = game
  const sportsbook = sportsbooks.find((sb) => sb.id === sportsbookID)

  const { addToCart } = useCart()

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
  console.log(homeSpread?.points, homeSpread?.name, (homeSpread?.points ?? 0) > 0 && '+')
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

  return (
    <Link href={`${usePathname()}/${game.id}`}>
      <Card className='cursor-pointer hover:bg-muted'>
        <CardContent className='px-6 py-4'>
          <div className='grid grid-cols-5 grid-rows-3 gap-4'>
            <div className='col-span-2'>{localStartTime}</div>
            <div className='flex justify-center text-muted-foreground'>Spread</div>
            <div className='flex justify-center text-muted-foreground'>Over/Under</div>
            <div className='flex justify-center text-muted-foreground'>Money</div>

            <div className='col-span-2 flex items-center font-bold text-xl'>
              {teams.away.abbreviation} {teams.away.name.split(' ').pop()}
            </div>
            <Card
              className='p-2 hover:bg-primary/20'
              onClick={(event) => {
                event.preventDefault()
                awaySpread && addToCart(awaySpread)
              }}
            >
              <CardContent className='flex flex-col justify-center items-center p-0'>
                <span>{`${(awaySpread?.points ?? 0) > 0 ? '+' : ''}${awaySpread?.points}`}</span>
                <span>{awaySpread?.price}</span>
              </CardContent>
            </Card>
            <Card
              className='p-2 hover:bg-primary/20'
              onClick={(event) => {
                event.preventDefault()
                overTotal && addToCart(overTotal)
              }}
            >
              <CardContent className='flex flex-col justify-center items-center p-0'>
                <span>O {overTotal?.points}</span>
                <span>{overTotal?.price}</span>
              </CardContent>
            </Card>
            <Card
              className='p-2 hover:bg-primary/20'
              onClick={(event) => {
                event.preventDefault()
                awayMoneyline && addToCart(awayMoneyline)
              }}
            >
              <CardContent className='flex flex-col justify-center items-center p-0 h-full w-full'>
                <span>{awayMoneyline?.price}</span>
              </CardContent>
            </Card>

            <div className='col-span-2 flex items-center font-bold text-xl'>
              {teams.home.abbreviation} {teams.home.name.split(' ').pop()}
            </div>
            <Card
              className='p-2 hover:bg-primary/20'
              onClick={(event) => {
                event.preventDefault()
                homeSpread && addToCart(homeSpread)
              }}
            >
              <CardContent className='flex flex-col justify-center items-center p-0'>
                <span>{`${(homeSpread?.points ?? 0) > 0 ? '+' : ''}${homeSpread?.points}`}</span>
                <span>{homeSpread?.price}</span>
              </CardContent>
            </Card>
            <Card
              className='p-2 hover:bg-primary/20'
              onClick={(event) => {
                event.preventDefault()
                underTotal && addToCart(underTotal)
              }}
            >
              <CardContent className='flex flex-col justify-center items-center p-0'>
                <span>U {underTotal?.points}</span>
                <span>{underTotal?.price}</span>
              </CardContent>
            </Card>
            <Card
              className='p-2 hover:bg-primary/20'
              onClick={(event) => {
                event.preventDefault()
                homeMoneyline && addToCart(homeMoneyline)
              }}
            >
              <CardContent className='flex flex-col justify-center items-center p-0 h-full w-full'>
                <span>{homeMoneyline?.price}</span>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
