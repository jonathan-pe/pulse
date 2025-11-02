import { Button } from '@/components/ui/button'
import useCartStore from '@/store/cart'
import type { CartSelection } from '@/store/cart'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { UpcomingGame } from '@/routes/_authenticated/_home/-components/UpcomingGamesTable'

const ExpandedGameTableContent = ({ game }: { game: UpcomingGame }) => {
  const addSelection = useCartStore((s) => s.addSelection)
  const removeSelection = useCartStore((s) => s.removeSelection)
  const selections = useCartStore((s) => s.selections)

  // Check if a selection exists in the cart
  const hasSelection = (gameId: string, market: CartSelection['market'], side: CartSelection['side']) => {
    return selections.some((s) => s.gameId === gameId && s.market === market && s.side === side)
  }

  // Toggle selection helper
  const toggleSelection = (
    market: 'moneyline' | 'spread' | 'total',
    side: 'home' | 'away' | 'over' | 'under',
    oddsValue: number,
    teamName?: string
  ) => {
    // Check if this selection is already in cart
    if (hasSelection(game.id, market, side)) {
      // Remove if already selected
      removeSelection(game.id, market, side)
      return
    }

    // Remove any conflicting selections for the same game and market
    // For the same game/market, user can only have one side selected
    const oppositeSide =
      market === 'moneyline'
        ? side === 'home'
          ? 'away'
          : 'home'
        : market === 'spread'
        ? side === 'home'
          ? 'away'
          : 'home'
        : side === 'over'
        ? 'under'
        : 'over'

    if (hasSelection(game.id, market, oppositeSide as typeof side)) {
      removeSelection(game.id, market, oppositeSide as typeof side)
    }

    // Add the new selection
    const newSelection: CartSelection = {
      gameId: game.id,
      homeTeam: game.homeTeam,
      awayTeam: game.awayTeam,
      league: game.league,
      startsAt: typeof game.startsAt === 'string' ? new Date(game.startsAt) : game.startsAt,
      market,
      side,
      odds: oddsValue,
      teamName,
    }

    addSelection(newSelection)
  }

  const odds = game.odds

  // Extract odds values for type narrowing
  const moneylineHome = odds.moneyline?.home
  const moneylineAway = odds.moneyline?.away
  const spreadValue = odds.spread?.value
  const totalValue = odds.total?.value

  return (
    <div className='space-y-4'>
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
          {/* Home Team Row */}
          <TableRow>
            <TableHead>{game.homeTeam}</TableHead>

            {/* Moneyline Home */}
            <TableHead>
              {moneylineHome ? (
                <Button
                  variant={hasSelection(game.id, 'moneyline', 'home') ? 'default' : 'outline'}
                  size='sm'
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleSelection('moneyline', 'home', moneylineHome, game.homeTeam)
                  }}
                >
                  {moneylineHome > 0 ? `+${moneylineHome}` : moneylineHome}
                </Button>
              ) : (
                '-'
              )}
            </TableHead>

            {/* Spread Home */}
            <TableHead>
              {spreadValue != null ? (
                <Button
                  variant={hasSelection(game.id, 'spread', 'home') ? 'default' : 'outline'}
                  size='sm'
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleSelection('spread', 'home', spreadValue, game.homeTeam)
                  }}
                >
                  {spreadValue > 0 ? `+${spreadValue}` : spreadValue}
                </Button>
              ) : (
                '-'
              )}
            </TableHead>

            {/* Over */}
            <TableHead>
              {totalValue != null ? (
                <Button
                  variant={hasSelection(game.id, 'total', 'over') ? 'default' : 'outline'}
                  size='sm'
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleSelection('total', 'over', totalValue)
                  }}
                >
                  {`Over ${totalValue}`}
                </Button>
              ) : (
                '-'
              )}
            </TableHead>
          </TableRow>

          {/* Away Team Row */}
          <TableRow>
            <TableHead>{game.awayTeam}</TableHead>

            {/* Moneyline Away */}
            <TableHead>
              {moneylineAway ? (
                <Button
                  variant={hasSelection(game.id, 'moneyline', 'away') ? 'default' : 'outline'}
                  size='sm'
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleSelection('moneyline', 'away', moneylineAway, game.awayTeam)
                  }}
                >
                  {moneylineAway > 0 ? `+${moneylineAway}` : moneylineAway}
                </Button>
              ) : (
                '-'
              )}
            </TableHead>

            {/* Spread Away */}
            <TableHead>
              {spreadValue != null ? (
                <Button
                  variant={hasSelection(game.id, 'spread', 'away') ? 'default' : 'outline'}
                  size='sm'
                  onClick={(e) => {
                    e.stopPropagation()
                    // Invert the spread for away team
                    toggleSelection('spread', 'away', spreadValue * -1, game.awayTeam)
                  }}
                >
                  {spreadValue > 0 ? `-${spreadValue}` : `+${Math.abs(spreadValue)}`}
                </Button>
              ) : (
                '-'
              )}
            </TableHead>

            {/* Under */}
            <TableHead>
              {totalValue != null ? (
                <Button
                  variant={hasSelection(game.id, 'total', 'under') ? 'default' : 'outline'}
                  size='sm'
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleSelection('total', 'under', totalValue)
                  }}
                >
                  {`Under ${totalValue}`}
                </Button>
              ) : (
                '-'
              )}
            </TableHead>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}

export default ExpandedGameTableContent
