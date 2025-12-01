import React from 'react'
import { XIcon, Flame, TrendingUp } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import useCartStore, { getCartKey, calculateSelectionPoints, type CartSelection } from '@/store/cart'
import { useCreatePredictionsFromCart } from '@/hooks/usePredictions'
import { useDailyPredictionStats } from '@/hooks/usePredictions'
import { useIsMobile } from '@/hooks/use-mobile'

const BONUS_TIER_PICKS = 1

const BetSlipSidebar: React.FC = () => {
  const isMobile = useIsMobile()
  const selections = useCartStore((s) => s.selections)
  const isOpen = useCartStore((s) => s.isOpen)
  const setCartOpen = useCartStore((s) => s.setCartOpen)
  const removeSelection = useCartStore((s) => s.removeSelection)
  const clearCart = useCartStore((s) => s.clearCart)

  const createPredictions = useCreatePredictionsFromCart()
  const { data: dailyStats } = useDailyPredictionStats()

  const handleSubmitPredictions = async () => {
    if (selections.length === 0) return

    try {
      await createPredictions.mutateAsync(selections)
      clearCart()
      setCartOpen(false)
    } catch {
      // Error handling is done in the hook via toast
    }
  }

  // Calculate total potential points
  const totalPotentialPoints = selections.reduce((sum, selection) => sum + calculateSelectionPoints(selection), 0)

  // Determine bonus tier status
  const bonusTierUsed = dailyStats?.totalToday ?? 0
  const bonusTierRemaining = Math.max(0, BONUS_TIER_PICKS - bonusTierUsed)

  // Mock streak - in a real implementation, this would come from an API
  // For now, we'll show a placeholder
  const currentStreak = 0 // TODO: Fetch from API

  const formatOdds = (odds: number): string => {
    return odds > 0 ? `+${odds}` : `${odds}`
  }

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
          <SheetTitle>Bet Slip</SheetTitle>
          <SheetDescription>Review your selections and submit predictions</SheetDescription>
        </SheetHeader>

        <div className='flex flex-1 flex-col gap-4 overflow-hidden px-4 pb-4'>
          {/* Engagement Stats */}
          <div className='grid grid-cols-2 gap-3'>
            {/* Bonus Tier Status */}
            <div className='rounded-lg border bg-card p-3'>
              <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                <TrendingUp className='h-4 w-4' />
                <span>Bonus Tier</span>
              </div>
              <div className='mt-1 text-lg font-semibold'>
                {bonusTierRemaining}/{BONUS_TIER_PICKS}{' '}
                <span className='text-sm font-normal text-muted-foreground'>available</span>
              </div>
            </div>

            {/* Current Streak */}
            <div className='rounded-lg border bg-card p-3'>
              <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                <Flame className='h-4 w-4' />
                <span>Streak</span>
              </div>
              <div className='mt-1 text-lg font-semibold'>
                {currentStreak === 0 ? (
                  <span className='text-muted-foreground'>None</span>
                ) : (
                  <>
                    {currentStreak} <span className='text-sm font-normal text-muted-foreground'>wins</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Selections List */}
          <div className='flex min-h-0 flex-1 flex-col gap-2'>
            <div className='flex items-center justify-between'>
              <h3 className='text-sm font-medium'>
                Selections {selections.length > 0 && <Badge variant='secondary'>{selections.length}</Badge>}
              </h3>
              {selections.length > 0 && (
                <Button variant='ghost' size='sm' onClick={clearCart} className='h-8 text-xs'>
                  Clear All
                </Button>
              )}
            </div>

            {selections.length === 0 ? (
              <div className='flex flex-1 flex-col items-center justify-center text-center'>
                <div className='text-muted-foreground'>
                  <p className='text-sm'>No selections yet</p>
                  <p className='mt-1 text-xs'>Add games to your bet slip to get started</p>
                </div>
              </div>
            ) : (
              <div className='flex-1 space-y-2 overflow-y-auto pr-2'>
                {selections.map((selection) => {
                  const points = calculateSelectionPoints(selection)
                  return (
                    <div
                      key={getCartKey(selection)}
                      className='group relative rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50'
                    >
                      <div className='flex items-start justify-between gap-3'>
                        <div className='flex-1 space-y-1'>
                          {/* Team/Game Info */}
                          <div className='text-sm font-medium'>
                            {selection.teamName || `${selection.awayTeam} @ ${selection.homeTeam}`}
                          </div>

                          {/* League Badge */}
                          <Badge variant='outline' className='text-xs'>
                            {selection.league}
                          </Badge>

                          {/* Bet Details */}
                          <div className='text-xs text-muted-foreground'>{getBetDetail(selection)}</div>

                          {/* Points Preview */}
                          <div className='mt-2 flex items-center gap-1 text-xs font-medium text-primary'>
                            <TrendingUp className='h-3 w-3' />
                            <span>+{points} points</span>
                          </div>
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

              {/* Total Points Preview */}
              <div className='rounded-lg bg-primary/10 p-4'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-muted-foreground'>Potential Points</span>
                  <span className='text-2xl font-bold text-primary'>+{totalPotentialPoints}</span>
                </div>
                <p className='mt-1 text-xs text-muted-foreground'>Base points before streak bonuses</p>
              </div>

              {/* Submit Button */}
              <Button
                className='w-full'
                size='lg'
                disabled={selections.length === 0 || createPredictions.isPending}
                onClick={handleSubmitPredictions}
              >
                {createPredictions.isPending ? 'Creating Predictions...' : `Create ${selections.length} Predictions`}
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default BetSlipSidebar
