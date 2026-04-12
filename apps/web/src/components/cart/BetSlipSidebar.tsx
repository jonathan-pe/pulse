import React, { useMemo } from 'react'
import { XIcon, InfoIcon } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import useCartStore, { getCartKey, calculateSelectionPoints, type CartSelection } from '@/store/cart'
import { useCreateParlayFromCart, useCreatePredictionsFromCart } from '@/hooks/usePredictions'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  calculateIncorrectPoints,
  formatOdds,
  previewMultiGameParlayPoints,
  previewSameGameParlayPoints,
} from '@pulse/shared'
import { PredictionPointsPreview } from '@/components/predictions/PredictionPointsPreview'
import { getLeagueBadgeColor } from '@/lib/league-colors'
import { inferParlayTicketType } from '@/lib/parlay-ticket'

const BetSlipSidebar: React.FC = () => {
  const isMobile = useIsMobile()
  const selections = useCartStore((s) => s.selections)
  const parlayMode = useCartStore((s) => s.parlayMode)
  const setParlayMode = useCartStore((s) => s.setParlayMode)
  const isOpen = useCartStore((s) => s.isOpen)
  const setCartOpen = useCartStore((s) => s.setCartOpen)
  const removeSelection = useCartStore((s) => s.removeSelection)
  const clearCart = useCartStore((s) => s.clearCart)

  const createPredictions = useCreatePredictionsFromCart()
  const createParlay = useCreateParlayFromCart()

  const parlayShape = useMemo(() => inferParlayTicketType(selections), [selections])

  const parlayPointsPreview = useMemo(() => {
    if (!parlayMode || selections.length < 2 || !parlayShape) return null
    const odds = selections.map((s) => s.odds)
    return parlayShape === 'MULTI_GAME'
      ? previewMultiGameParlayPoints(odds)
      : previewSameGameParlayPoints(odds)
  }, [parlayMode, selections, parlayShape])

  const handleSubmitPredictions = async () => {
    if (selections.length === 0) return

    try {
      if (parlayMode) {
        await createParlay.mutateAsync(selections)
      } else {
        await createPredictions.mutateAsync(selections)
      }
      clearCart()
      setCartOpen(false)
    } catch {
      // Error handling is done in the hook via toast
    }
  }

  const totalPotentialPoints = parlayMode
    ? parlayPointsPreview?.winPointsRounded ?? 0
    : selections.reduce((sum, selection) => sum + calculateSelectionPoints(selection), 0)

  const totalPotentialLoss = parlayMode
    ? parlayPointsPreview?.lossPoints ?? 0
    : selections.reduce((sum, selection) => {
        const loss = calculateIncorrectPoints(selection.odds)
        return sum + loss
      }, 0)

  const submitPending = parlayMode ? createParlay.isPending : createPredictions.isPending

  const parlayInvalid =
    parlayMode && selections.length >= 2 && selections.length > 0 && parlayShape === null

  const submitDisabled =
    selections.length === 0 ||
    submitPending ||
    (parlayMode && (selections.length < 2 || parlayInvalid))

  const getBetDetail = (selection: CartSelection): string => {
    switch (selection.market) {
      case 'moneyline':
        return `Moneyline ${selection.side === 'home' ? '(Home)' : '(Away)'} • ${formatOdds(selection.odds)}`
      case 'spread':
        return `Spread ${formatOdds(selection.odds)}`
      case 'total':
        return `${selection.side === 'over' ? 'Over' : 'Under'} ${selection.odds}`
      default:
        return ''
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setCartOpen}>
      <SheetContent side={isMobile ? 'bottom' : 'right'} className={isMobile ? 'h-[80vh]' : 'w-[400px] sm:w-[540px]'}>
        <SheetHeader>
          <SheetTitle>Prediction slip</SheetTitle>
        </SheetHeader>

        <div className='flex flex-1 flex-col gap-4 overflow-hidden px-4 pb-4'>
          <div className='flex flex-wrap items-center justify-between gap-2'>
            <span className='text-xs text-muted-foreground'>Slip mode</span>
            <div className='flex gap-1'>
              <Button
                type='button'
                variant={!parlayMode ? 'default' : 'outline'}
                size='sm'
                className='h-8 text-xs'
                onClick={() => setParlayMode(false)}
              >
                Singles
              </Button>
              <Button
                type='button'
                variant={parlayMode ? 'default' : 'outline'}
                size='sm'
                className='h-8 text-xs'
                onClick={() => setParlayMode(true)}
              >
                Parlay / SGP
              </Button>
            </div>
          </div>

          {/* Selections List */}
          <div className='flex min-h-0 flex-1 flex-col gap-2'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <h3 className='text-sm font-medium'>
                  Picks {selections.length > 0 && <Badge variant='secondary'>{selections.length}</Badge>}
                </h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoIcon className='h-3.5 w-3.5 cursor-help text-muted-foreground' />
                    </TooltipTrigger>
                    <TooltipContent className='max-w-[250px]'>
                      <p className='text-xs'>
                        {parlayMode
                          ? 'Parlay mode places one combined ticket: either multiple picks on the same game (SGP) or one pick per game across games. Points are scored once for the whole ticket.'
                          : 'Each pick becomes its own prediction.'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              {selections.length > 0 && (
                <Button variant='ghost' size='sm' onClick={clearCart} className='h-8 text-xs'>
                  Clear All
                </Button>
              )}
            </div>

            {selections.length === 0 ? (
              <div className='flex flex-1 flex-col items-center justify-center text-center'>
                <div className='text-muted-foreground'>
                  <p className='text-sm'>No picks yet</p>
                  <p className='mt-1 text-xs'>Choose sides on upcoming games to add them here.</p>
                </div>
              </div>
            ) : (
              <div className='flex-1 space-y-2 overflow-y-auto pr-2'>
                {selections.map((selection) => {
                  return (
                    <div
                      key={getCartKey(selection)}
                      className='group relative rounded-lg border bg-card p-3 hover:bg-accent/50'
                    >
                      <div className='flex items-start justify-between gap-3'>
                        <div className='flex-1 space-y-1'>
                          {/* Matchup + league + pick */}
                          <div className='space-y-0.5'>
                            <div className='flex flex-wrap items-center gap-x-2 gap-y-1'>
                              <span className='text-sm font-medium leading-snug'>
                                {selection.awayTeam} @ {selection.homeTeam}
                              </span>
                              <Badge variant='outline' className={`shrink-0 text-xs ${getLeagueBadgeColor(selection.league)}`}>
                                {selection.league}
                              </Badge>
                            </div>
                            {selection.teamName ? (
                              <div className='text-sm text-muted-foreground leading-snug'>{selection.teamName}</div>
                            ) : null}
                          </div>

                          {/* Pick details */}
                          <div className='text-xs text-muted-foreground'>{getBetDetail(selection)}</div>

                          {!parlayMode && (
                            <div className='mt-2'>
                              <PredictionPointsPreview odds={selection.odds} />
                            </div>
                          )}
                        </div>

                        {/* Remove Button */}
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100'
                          onClick={() => removeSelection(selection.gameId, selection.market, selection.side)}
                        >
                          <XIcon className='h-4 w-4' />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

            {selections.length > 0 && (
              <>
                <Separator />

                {parlayInvalid && (
                  <p className='text-xs text-destructive'>
                    Parlay must be either one game with two or more picks (SGP), or one pick per game from different
                    games. Adjust your slip.
                  </p>
                )}

                {/* Total Points Preview */}
                <div className='space-y-2'>
                  <div className='rounded-lg bg-success/10 p-4'>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-muted-foreground'>
                        {parlayMode ? 'If parlay wins' : 'If all correct'}
                      </span>
                      <span className='text-2xl font-bold text-success'>+{totalPotentialPoints}</span>
                    </div>
                  </div>
                  <div className='rounded-lg bg-destructive/10 p-4'>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-muted-foreground'>
                        {parlayMode ? 'If parlay loses' : 'If all incorrect'}
                      </span>
                      <span className='text-2xl font-bold text-destructive'>{totalPotentialLoss.toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  className='w-full'
                  size='lg'
                  disabled={submitDisabled}
                  onClick={handleSubmitPredictions}
                >
                  {submitPending
                    ? parlayMode
                      ? 'Placing parlay…'
                      : 'Creating Predictions...'
                    : parlayMode
                      ? `Place parlay (${selections.length} legs)`
                      : `Create ${selections.length} Predictions`}
                </Button>
              </>
            )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default BetSlipSidebar
