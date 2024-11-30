import React, { useMemo } from 'react'
import { Card, CardContent } from '@/app/components/ui/card'
import OddCard from '@/app/sportsbook/components/odd-card'
import { ScrollArea, ScrollBar } from '@/app/components/ui/scroll-area'
import { Game, Odds } from '@/types/game'
import { getSelectionOrderPriority } from '@/app/lib/utils'

interface MarketCardProps {
  game: Game
  market: string
  odds: Odds[]
  awayTeamName: string
  homeTeamName: string
}

const MarketCard = ({ game, market, odds, awayTeamName, homeTeamName }: MarketCardProps) => {
  const groupedOdds = useMemo(
    () =>
      odds.reduce((acc, odd) => {
        const grouper = market.includes('Player') ? odd.name : odd.selection

        if (!acc[grouper]) acc[grouper] = []
        acc[grouper].push(odd)
        return acc
      }, {} as Record<string, Odds[]>),
    [odds, market]
  )

  const displaySelection = (selection: string) => {
    if (selection === 'Home') return homeTeamName
    if (selection === 'Away') return awayTeamName
    return selection
  }

  return (
    <Card>
      <CardContent className='px-6 py-4'>
        <div className='grid gap-4'>
          <div>
            <h3 className='text-lg font-bold text-muted-foreground'>{market}</h3>
          </div>

          {Object.keys(groupedOdds)
            .sort((a, b) => {
              return getSelectionOrderPriority(a) - getSelectionOrderPriority(b)
            })
            .map((selection) => (
              <div className='grid grid-cols-5 gap-4' key={selection}>
                <div className='flex col-span-2 items-center font-bold text-xl'>{displaySelection(selection)}</div>
                <ScrollArea className='flex col-span-3 py-3'>
                  <div className='flex gap-2'>
                    {groupedOdds[selection]
                      .sort((a, b) => {
                        return (a.points ?? 0) - (b.points ?? 0)
                      })
                      .map((odd) => (
                        <OddCard key={odd.id} odd={odd} event={`${awayTeamName} @ ${homeTeamName}`} />
                      ))}
                  </div>
                  <ScrollBar orientation='horizontal' />
                </ScrollArea>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  )
}
export default MarketCard
