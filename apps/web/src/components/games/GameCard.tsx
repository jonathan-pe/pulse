import React from 'react'
import { Clock, CheckCircle2 } from 'lucide-react'
import type { GameWithUnifiedOdds } from '@pulse/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TeamLogo } from '@/components/TeamLogo'
import useCartStore from '@/store/cart'
import { usePredictionsByGame } from '@/hooks/usePredictions'
import { formatOdds } from '@pulse/shared'
import { getLeagueBadgeColor } from '@/lib/league-colors'

interface GameCardProps {
  game: GameWithUnifiedOdds
}

const GameCard: React.FC<GameCardProps> = ({ game }) => {
  const addSelection = useCartStore((s) => s.addSelection)
  const selections = useCartStore((s) => s.selections)
  const setCartOpen = useCartStore((s) => s.setCartOpen)

  const { data: predictionsByGame } = usePredictionsByGame()

  // Helper to check if a selection exists in the cart
  const hasSelection = (
    gameId: string,
    market: 'moneyline' | 'spread' | 'total',
    side: 'home' | 'away' | 'over' | 'under'
  ) => {
    return selections.some((s) => s.gameId === gameId && s.market === market && s.side === side)
  }

  // Helper to check if user has already made a specific prediction
  const hasPrediction = (type: 'MONEYLINE' | 'SPREAD' | 'TOTAL', pick: string): boolean => {
    if (!predictionsByGame || !predictionsByGame[game.id]) return false
    return predictionsByGame[game.id][type] === pick
  }

  const isGameLocked = new Date(game.startsAt) < new Date()

  const handleAddToCart = (
    market: 'moneyline' | 'spread' | 'total',
    side: 'home' | 'away' | 'over' | 'under',
    odds: number,
    teamName?: string
  ) => {
    const isCurrentlySelected = hasSelection(game.id, market, side)

    addSelection({
      gameId: game.id,
      homeTeam: game.homeTeam.name,
      awayTeam: game.awayTeam.name,
      league: game.league,
      startsAt: new Date(game.startsAt),
      market,
      side,
      odds,
      teamName,
    })

    // Only open cart when adding a selection, not when removing
    if (!isCurrentlySelected) {
      setCartOpen(true)
    }
  }

  const formatGameTime = (startsAt: Date | string) => {
    const date = new Date(startsAt)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(date)
  }

  return (
    <Card className='overflow-hidden transition-shadow hover:shadow-md'>
      <CardContent className='px-6'>
        {/* Header: League Badge and Status */}
        <div className='mb-3 flex items-center justify-between'>
          <Badge variant='outline' className={getLeagueBadgeColor(game.league)}>
            {game.league}
          </Badge>

          {isGameLocked ? (
            <Badge variant='secondary' className='text-xs'>
              <CheckCircle2 className='mr-1 h-3 w-3' />
              {game.status}
            </Badge>
          ) : (
            <div className='flex items-center gap-1 text-xs text-muted-foreground'>
              <Clock className='h-3 w-3' />
              {formatGameTime(game.startsAt)}
            </div>
          )}
        </div>

        {/* Teams */}
        <div className='mb-4 space-y-2'>
          {/* Away Team */}
          <div className='flex items-center gap-3'>
            <TeamLogo
              logoUrl={game.awayTeam.logoUrl}
              teamName={game.awayTeam.name}
              teamCode={game.awayTeam.code}
              size='md'
            />
            <div className='flex-1'>
              <div className='font-medium'>{game.awayTeam.name}</div>
              {game.result && <div className='text-xl font-bold'>{game.result.awayScore}</div>}
            </div>
          </div>

          {/* Home Team */}
          <div className='flex items-center gap-3'>
            <TeamLogo
              logoUrl={game.homeTeam.logoUrl}
              teamName={game.homeTeam.name}
              teamCode={game.homeTeam.code}
              size='md'
            />
            <div className='flex-1'>
              <div className='font-medium'>{game.homeTeam.name}</div>
              {game.result && <div className='text-xl font-bold'>{game.result.homeScore}</div>}
            </div>
          </div>
        </div>

        {/* Odds and Action Buttons */}
        {!isGameLocked && (
          <div className='space-y-3 border-t pt-3'>
            {/* Show placeholder if no odds are available */}
            {!game.odds.moneyline && !game.odds.spread && !game.odds.total && (
              <div className='py-4 text-center text-sm text-muted-foreground'>Odds Not Found</div>
            )}

            {/* Moneyline */}
            {game.odds.moneyline && (
              <div className='space-y-2'>
                <div className='text-xs font-medium text-muted-foreground'>Moneyline</div>
                <div className='grid grid-cols-2 gap-2'>
                  <Button
                    variant={
                      hasSelection(game.id, 'moneyline', 'away') || hasPrediction('MONEYLINE', 'away')
                        ? 'default'
                        : 'outline'
                    }
                    size='sm'
                    disabled={hasPrediction('MONEYLINE', 'away') || isGameLocked}
                    onClick={() => handleAddToCart('moneyline', 'away', game.odds.moneyline!.away, game.awayTeam.name)}
                    className='h-9'
                  >
                    <span className='truncate'>{game.awayTeam.code}</span>
                    <span className='ml-auto font-mono text-xs'>{formatOdds(game.odds.moneyline.away)}</span>
                  </Button>
                  <Button
                    variant={
                      hasSelection(game.id, 'moneyline', 'home') || hasPrediction('MONEYLINE', 'home')
                        ? 'default'
                        : 'outline'
                    }
                    size='sm'
                    disabled={hasPrediction('MONEYLINE', 'home') || isGameLocked}
                    onClick={() => handleAddToCart('moneyline', 'home', game.odds.moneyline!.home, game.homeTeam.name)}
                    className='h-9'
                  >
                    <span className='truncate'>{game.homeTeam.code}</span>
                    <span className='ml-auto font-mono text-xs'>{formatOdds(game.odds.moneyline.home)}</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Spread */}
            {game.odds.spread && (
              <div className='space-y-2'>
                <div className='text-xs font-medium text-muted-foreground'>Spread</div>
                <div className='grid grid-cols-2 gap-2'>
                  <Button
                    variant={
                      hasSelection(game.id, 'spread', 'away') || hasPrediction('SPREAD', 'away') ? 'default' : 'outline'
                    }
                    size='sm'
                    disabled={hasPrediction('SPREAD', 'away') || isGameLocked}
                    onClick={() =>
                      handleAddToCart(
                        'spread',
                        'away',
                        game.odds.spread!.awayPrice || -110,
                        `${game.awayTeam.name} ${formatOdds(-game.odds.spread!.value)}`
                      )
                    }
                    className='h-9'
                  >
                    <span className='truncate'>{game.awayTeam.code}</span>
                    <span className='ml-auto font-mono text-xs'>{formatOdds(-game.odds.spread.value)}</span>
                  </Button>
                  <Button
                    variant={
                      hasSelection(game.id, 'spread', 'home') || hasPrediction('SPREAD', 'home') ? 'default' : 'outline'
                    }
                    size='sm'
                    disabled={hasPrediction('SPREAD', 'home') || isGameLocked}
                    onClick={() =>
                      handleAddToCart(
                        'spread',
                        'home',
                        game.odds.spread!.homePrice || -110,
                        `${game.homeTeam.name} ${formatOdds(game.odds.spread!.value)}`
                      )
                    }
                    className='h-9'
                  >
                    <span className='truncate'>{game.homeTeam.code}</span>
                    <span className='ml-auto font-mono text-xs'>{formatOdds(game.odds.spread.value)}</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Total */}
            {game.odds.total && (
              <div className='space-y-2'>
                <div className='text-xs font-medium text-muted-foreground'>Total</div>
                <div className='grid grid-cols-2 gap-2'>
                  <Button
                    variant={
                      hasSelection(game.id, 'total', 'over') || hasPrediction('TOTAL', 'over') ? 'default' : 'outline'
                    }
                    size='sm'
                    disabled={hasPrediction('TOTAL', 'over') || isGameLocked}
                    onClick={() =>
                      handleAddToCart(
                        'total',
                        'over',
                        game.odds.total!.overPrice || -110,
                        `Over ${game.odds.total!.value}`
                      )
                    }
                    className='h-9'
                  >
                    <span>O {game.odds.total.value}</span>
                    <span className='ml-auto font-mono text-xs'>{formatOdds(game.odds.total.overPrice || -110)}</span>
                  </Button>
                  <Button
                    variant={
                      hasSelection(game.id, 'total', 'under') || hasPrediction('TOTAL', 'under') ? 'default' : 'outline'
                    }
                    size='sm'
                    disabled={hasPrediction('TOTAL', 'under') || isGameLocked}
                    onClick={() =>
                      handleAddToCart(
                        'total',
                        'under',
                        game.odds.total!.underPrice || -110,
                        `Under ${game.odds.total!.value}`
                      )
                    }
                    className='h-9'
                  >
                    <span>U {game.odds.total.value}</span>
                    <span className='ml-auto font-mono text-xs'>{formatOdds(game.odds.total.underPrice || -110)}</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default GameCard
