import { Button } from '@/components/ui/button'
import useCartStore from '@/store/cart'
import type { Odd } from '@/store/cart'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { UpcomingGame } from '@/routes/_authenticated/_home/-components/UpcomingGamesTable'

const ExpandedGameTableContent = ({ game }: { game: UpcomingGame }) => {
  const addOdds = useCartStore((s) => s.addOdds)
  const removeOdds = useCartStore((s) => s.removeOdds)
  const cartOdds = useCartStore((s) => s.odds)

  // Toggle selection helper:
  // - If the exact same odd+side is already in the cart, remove it (deselect)
  // - Otherwise remove any conflicting selection for the same game+market, then add the new one
  const toggleOdd = (baseOdd: UpcomingGame['odds'][0], payload: Partial<Odd>) => {
    const side = payload.side
    const market = payload.market

    // Find exact match (same odds id and same chosen side)
    const exact = cartOdds.find((c) => c.id === baseOdd.id && c.side === side)
    if (exact && exact.id) {
      removeOdds(exact.id)
      return
    }

    // Remove conflicting selections for the same game and market
    const conflicts = cartOdds.filter((c) => c.gameId === baseOdd.gameId && c.market === market)
    conflicts.forEach((c) => c.id && removeOdds(c.id))

    // Add the new selection
    const newOdd: Odd = { ...baseOdd, ...payload }
    addOdds(newOdd)
  }

  // Group odds by provider and book for better organization
  const groupedOdds = game.odds.reduce((acc: Record<string, UpcomingGame['odds']>, odd: UpcomingGame['odds'][0]) => {
    const key = `${odd.provider}`
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(odd)
    return acc
  }, {} as Record<string, UpcomingGame['odds']>)

  return (
    <div className='space-y-4'>
      {Object.entries(groupedOdds).map(([key, odds]: [string, UpcomingGame['odds']]) => {
        const provider = key
        const mlOdd = odds.find((o: UpcomingGame['odds'][0]) => o.moneylineHome || o.moneylineAway)
        const spreadOdd = odds.find((o: UpcomingGame['odds'][0]) => o.spread !== null && o.spread !== undefined)
        const totalOdd = odds.find((o: UpcomingGame['odds'][0]) => o.total !== null && o.total !== undefined)
        return (
          <div key={key}>
            <div className='mb-2'>
              <span className='text-sm font-medium text-muted-foreground'>{provider}</span>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-[40%]' />
                  <TableHead className='w-[20%]'>Moneyline</TableHead>
                  <TableHead className='w-[20%]'>Spread</TableHead>
                  <TableHead className='w-[20%]'>Over/Under</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableHead>{game.homeTeam}</TableHead>
                  <TableHead>
                    {mlOdd && mlOdd.moneylineHome ? (
                      <div className='flex flex-wrap gap-1'>
                        {(() => {
                          const selected = cartOdds.some((c) => c.id === mlOdd.id && c.side === 'home')
                          return (
                            <Button
                              key={`${mlOdd.id}-home-ml`}
                              variant={selected ? 'default' : 'outline'}
                              size='sm'
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleOdd(mlOdd, {
                                  market: 'moneyline',
                                  teamName: game.homeTeam,
                                  side: 'home',
                                  selectedOdds: mlOdd.moneylineHome,
                                })
                              }}
                            >
                              {mlOdd.moneylineHome}
                            </Button>
                          )
                        })()}
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableHead>

                  <TableHead>
                    {spreadOdd && spreadOdd.spread !== null && spreadOdd.spread !== undefined ? (
                      <div className='flex flex-wrap gap-1'>
                        {(() => {
                          const selected = cartOdds.some((c) => c.id === spreadOdd.id && c.side === 'home')
                          return (
                            <Button
                              key={`${spreadOdd.id}-home-spread`}
                              variant={selected ? 'default' : 'outline'}
                              size='sm'
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleOdd(spreadOdd, {
                                  market: 'pointspread',
                                  teamName: game.homeTeam,
                                  side: 'home',
                                  selectedOdds: spreadOdd.spread,
                                })
                              }}
                            >
                              {spreadOdd.spread! > 0 ? `+${spreadOdd.spread}` : spreadOdd.spread}
                            </Button>
                          )
                        })()}
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableHead>

                  <TableHead>
                    {totalOdd && totalOdd.total !== null && totalOdd.total !== undefined ? (
                      <div className='flex flex-wrap gap-1'>
                        {(() => {
                          const selected = cartOdds.some((c) => c.id === totalOdd.id && c.side === 'over')
                          return (
                            <Button
                              key={`${totalOdd.id}-over`}
                              variant={selected ? 'default' : 'outline'}
                              size='sm'
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleOdd(totalOdd, {
                                  market: 'overunder',
                                  teamName: game.homeTeam,
                                  side: 'over',
                                  selectedOdds: totalOdd.total,
                                })
                              }}
                            >
                              {`Over ${totalOdd.total}`}
                            </Button>
                          )
                        })()}
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableHead>
                </TableRow>

                <TableRow>
                  <TableHead>{game.awayTeam}</TableHead>
                  <TableHead>
                    {mlOdd && mlOdd.moneylineAway ? (
                      <div className='flex flex-wrap gap-1'>
                        {(() => {
                          const selected = cartOdds.some((c) => c.id === mlOdd.id && c.side === 'away')
                          return (
                            <Button
                              key={`${mlOdd.id}-away-ml`}
                              variant={selected ? 'default' : 'outline'}
                              size='sm'
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleOdd(mlOdd, {
                                  market: 'moneyline',
                                  teamName: game.awayTeam,
                                  side: 'away',
                                  selectedOdds: mlOdd.moneylineAway,
                                })
                              }}
                            >
                              {mlOdd.moneylineAway}
                            </Button>
                          )
                        })()}
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableHead>

                  <TableHead>
                    {spreadOdd && spreadOdd.spread !== null && spreadOdd.spread !== undefined ? (
                      <div className='flex flex-wrap gap-1'>
                        {(() => {
                          const selected = cartOdds.some((c) => c.id === spreadOdd.id && c.side === 'away')
                          return (
                            <Button
                              key={`${spreadOdd.id}-away-spread`}
                              variant={selected ? 'default' : 'outline'}
                              size='sm'
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleOdd(spreadOdd, {
                                  market: 'pointspread',
                                  spread: spreadOdd.spread! * -1,
                                  teamName: game.awayTeam,
                                  side: 'away',
                                  selectedOdds: spreadOdd.spread! * -1,
                                })
                              }}
                            >
                              {spreadOdd.spread! > 0 ? `-${spreadOdd.spread}` : `+${Math.abs(spreadOdd.spread!)}`}
                            </Button>
                          )
                        })()}
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableHead>

                  <TableHead>
                    {totalOdd && totalOdd.total !== null && totalOdd.total !== undefined ? (
                      <div className='flex flex-wrap gap-1'>
                        {(() => {
                          const selected = cartOdds.some((c) => c.id === totalOdd.id && c.side === 'under')
                          return (
                            <Button
                              key={`${totalOdd.id}-under`}
                              variant={selected ? 'default' : 'outline'}
                              size='sm'
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleOdd(totalOdd, {
                                  market: 'overunder',
                                  teamName: game.awayTeam,
                                  side: 'under',
                                  selectedOdds: totalOdd.total,
                                })
                              }}
                            >
                              {`Under ${totalOdd.total}`}
                            </Button>
                          )
                        })()}
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableHead>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )
      })}
    </div>
  )
}

export default ExpandedGameTableContent
