import type { ReactElement } from 'react'
import type { GameWithUnifiedOdds } from '@pulse/types'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { formatOdds } from '@pulse/shared'
import type { GameCardMarket, GameCardPredictionType, GameCardSide } from '@/hooks/useGameCardPickState'

type GameCardMarketsProps = {
  game: GameWithUnifiedOdds
  isGameLocked: boolean
  hasSelection: (market: GameCardMarket, side: GameCardSide) => boolean
  hasPrediction: (type: GameCardPredictionType, pick: string) => boolean
  getParlayBlockTooltip: (type: GameCardPredictionType, pick: string) => string | undefined
  handleAddToCart: (market: GameCardMarket, side: GameCardSide, odds: number, teamName?: string) => void
}

function withParlayTooltip(tooltip: string | undefined, node: ReactElement): ReactElement {
  if (!tooltip) return node
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className='inline-flex w-full cursor-default' tabIndex={0}>
          {node}
        </span>
      </TooltipTrigger>
      <TooltipContent className='max-w-[280px]' side='top'>
        <p className='text-xs'>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  )
}

export function GameCardMarkets({
  game,
  isGameLocked,
  hasSelection,
  hasPrediction,
  getParlayBlockTooltip,
  handleAddToCart,
}: GameCardMarketsProps) {
  return (
    <TooltipProvider delayDuration={300}>
    <div className='space-y-3 border-t pt-3'>
      {!game.odds.moneyline && !game.odds.spread && !game.odds.total && (
        <div className='py-4 text-center text-sm text-muted-foreground'>Odds Not Found</div>
      )}

      {game.odds.moneyline && (
        <div className='space-y-2'>
          <div className='text-xs font-medium text-muted-foreground'>Moneyline</div>
          <div className='grid grid-cols-2 gap-2'>
            {withParlayTooltip(
              getParlayBlockTooltip('MONEYLINE', 'away'),
              <Button
                variant={
                  hasSelection('moneyline', 'away') || hasPrediction('MONEYLINE', 'away') ? 'default' : 'outline'
                }
                size='sm'
                disabled={hasPrediction('MONEYLINE', 'away') || isGameLocked}
                onClick={() =>
                  handleAddToCart('moneyline', 'away', game.odds.moneyline!.away, game.awayTeam.name)
                }
                className='h-9 w-full'
              >
                <span className='truncate'>{game.awayTeam.code}</span>
                <span className='ml-auto font-mono text-xs'>{formatOdds(game.odds.moneyline.away)}</span>
              </Button>
            )}
            {withParlayTooltip(
              getParlayBlockTooltip('MONEYLINE', 'home'),
              <Button
                variant={
                  hasSelection('moneyline', 'home') || hasPrediction('MONEYLINE', 'home') ? 'default' : 'outline'
                }
                size='sm'
                disabled={hasPrediction('MONEYLINE', 'home') || isGameLocked}
                onClick={() =>
                  handleAddToCart('moneyline', 'home', game.odds.moneyline!.home, game.homeTeam.name)
                }
                className='h-9 w-full'
              >
                <span className='truncate'>{game.homeTeam.code}</span>
                <span className='ml-auto font-mono text-xs'>{formatOdds(game.odds.moneyline.home)}</span>
              </Button>
            )}
          </div>
        </div>
      )}

      {game.odds.spread && (
        <div className='space-y-2'>
          <div className='text-xs font-medium text-muted-foreground'>Spread</div>
          <div className='grid grid-cols-2 gap-2'>
            {withParlayTooltip(
              getParlayBlockTooltip('SPREAD', 'away'),
              <Button
                variant={hasSelection('spread', 'away') || hasPrediction('SPREAD', 'away') ? 'default' : 'outline'}
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
                className='h-9 w-full'
              >
                <span className='truncate'>{game.awayTeam.code}</span>
                <span className='ml-auto font-mono text-xs'>{formatOdds(-game.odds.spread.value)}</span>
              </Button>
            )}
            {withParlayTooltip(
              getParlayBlockTooltip('SPREAD', 'home'),
              <Button
                variant={hasSelection('spread', 'home') || hasPrediction('SPREAD', 'home') ? 'default' : 'outline'}
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
                className='h-9 w-full'
              >
                <span className='truncate'>{game.homeTeam.code}</span>
                <span className='ml-auto font-mono text-xs'>{formatOdds(game.odds.spread.value)}</span>
              </Button>
            )}
          </div>
        </div>
      )}

      {game.odds.total && (
        <div className='space-y-2'>
          <div className='text-xs font-medium text-muted-foreground'>Total</div>
          <div className='grid grid-cols-2 gap-2'>
            {withParlayTooltip(
              getParlayBlockTooltip('TOTAL', 'over'),
              <Button
                variant={hasSelection('total', 'over') || hasPrediction('TOTAL', 'over') ? 'default' : 'outline'}
                size='sm'
                disabled={hasPrediction('TOTAL', 'over') || isGameLocked}
                onClick={() =>
                  handleAddToCart('total', 'over', game.odds.total!.overPrice || -110, `Over ${game.odds.total!.value}`)
                }
                className='h-9 w-full'
              >
                <span>O {game.odds.total.value}</span>
                <span className='ml-auto font-mono text-xs'>{formatOdds(game.odds.total.overPrice || -110)}</span>
              </Button>
            )}
            {withParlayTooltip(
              getParlayBlockTooltip('TOTAL', 'under'),
              <Button
                variant={hasSelection('total', 'under') || hasPrediction('TOTAL', 'under') ? 'default' : 'outline'}
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
                className='h-9 w-full'
              >
                <span>U {game.odds.total.value}</span>
                <span className='ml-auto font-mono text-xs'>{formatOdds(game.odds.total.underPrice || -110)}</span>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
    </TooltipProvider>
  )
}
