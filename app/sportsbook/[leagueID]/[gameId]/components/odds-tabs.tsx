import { MARKETS } from '@/app/constants'
import { Game, Odds, Team } from '@/types/game'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/app/components/ui/tabs'
import MarketCard from './market-card'

export interface OddsTabsProps {
  game: Game
  homeTeam: Team
  awayTeam: Team
}

const OddsTabs = ({ game, homeTeam, awayTeam }: OddsTabsProps) => {
  const homeTeamName = `${homeTeam.abbreviation} ${homeTeam.name.split(' ').pop()}`
  const awayTeamName = `${awayTeam.abbreviation} ${awayTeam.name.split(' ').pop()}`

  /* looks like:
    {
      SPREADS: {
        1st Half Point Spread: [Odds, Odds, Odds],
        Point Spread: [Odds, Odds, Odds],
        ...
      },
      ...
    }
  */
  const oddsGroupedByMarketAndMarketType = game.sportsbooks[0].odds.reduce((acc, odd) => {
    const market = Object.keys(MARKETS).find((market) =>
      odd.market.includes(MARKETS[market as keyof typeof MARKETS].oddsBlazeString)
    )
    if (!market) return acc

    if (!acc[market]) acc[market] = {}
    if (!acc[market][odd.market]) acc[market][odd.market] = []

    acc[market][odd.market].push(odd)

    return acc
  }, {} as Record<string, Record<string, Odds[]>>)

  return (
    <Tabs defaultValue={Object.keys(MARKETS)[0]}>
      <TabsList>
        {Object.keys(MARKETS).map((market) => (
          <TabsTrigger key={market} value={market}>
            {MARKETS[market as keyof typeof MARKETS].name}
          </TabsTrigger>
        ))}
      </TabsList>
      {Object.keys(oddsGroupedByMarketAndMarketType).map((marketType) => (
        <TabsContent key={marketType} value={marketType} className='grid gap-4 grid-cols-2'>
          {Object.keys(oddsGroupedByMarketAndMarketType[marketType]).map((market: string) => (
            <MarketCard
              key={market}
              market={market}
              game={game}
              odds={oddsGroupedByMarketAndMarketType[marketType][market]}
              awayTeamName={awayTeamName}
              homeTeamName={homeTeamName}
            />
          ))}
        </TabsContent>
      ))}
    </Tabs>
  )
}

export default OddsTabs
