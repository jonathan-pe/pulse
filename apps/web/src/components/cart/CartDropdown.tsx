import React from 'react'
import { ShoppingCart, XIcon } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import useCartStore, { getCartKey } from '@/store/cart'
import type { CartSelection } from '@/store/cart'
import { Button } from '@/components/ui/button'
import { useCreatePredictionsFromCart } from '@/hooks/usePredictions'
import { PredictionPointsPreview } from '@/components/predictions/PredictionPointsPreview'

const CartDropdown: React.FC = () => {
  const selections = useCartStore((s) => s.selections)
  const removeSelection = useCartStore((s) => s.removeSelection)
  const clearCart = useCartStore((s) => s.clearCart)

  const createPredictions = useCreatePredictionsFromCart()

  const handleSubmitPredictions = async () => {
    if (selections.length === 0) return

    try {
      await createPredictions.mutateAsync(selections)
      // Clear cart on success
      clearCart()
    } catch {
      // Error handling is done in the hook via toast
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' aria-label='Cart'>
          <ShoppingCart />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className='w-80 p-2'>
        <DropdownMenuLabel>Selections</DropdownMenuLabel>
        <div className='max-h-52 overflow-y-auto'>
          {selections.length === 0 && <div className='px-2 py-2 text-sm text-muted-foreground'>No selections</div>}
          {selections.map((selection: CartSelection) => {
            let betDetail = ''

            // Moneyline
            if (selection.market === 'moneyline') {
              betDetail = `Moneyline ${selection.side === 'home' ? '(Home)' : '(Away)'} • ${
                selection.odds > 0 ? '+' : ''
              }${selection.odds}`
            }

            // Spread
            if (selection.market === 'spread') {
              betDetail = `Spread ${selection.odds > 0 ? '+' : ''}${selection.odds}`
            }

            // Total
            if (selection.market === 'total') {
              betDetail = `${selection.side === 'over' ? 'Over' : 'Under'} ${selection.odds}`
            }

            return (
              <div key={getCartKey(selection)} className='flex flex-col gap-2 px-2 py-2 border-b last:border-0'>
                <div className='flex items-center justify-between gap-2'>
                  <div className='flex-1'>
                    <div className='text-sm font-medium'>
                      {selection.teamName || `${selection.awayTeam} @ ${selection.homeTeam}`}
                    </div>
                    <div className='text-xs text-muted-foreground'>{betDetail}</div>
                  </div>

                  <Button
                    variant='destructive'
                    size='icon'
                    onClick={() => {
                      removeSelection(selection.gameId, selection.market, selection.side)
                    }}
                  >
                    <XIcon className='h-4 w-4' />
                  </Button>
                </div>

                {/* Points preview */}
                <PredictionPointsPreview odds={selection.odds} className='pt-1' />
              </div>
            )
          })}
        </div>

        <DropdownMenuSeparator />
        <div className='flex items-center justify-between gap-2 px-2'>
          <Button variant='ghost' size='sm' onClick={() => clearCart()}>
            Clear
          </Button>
          <Button disabled={selections.length === 0 || createPredictions.isPending} onClick={handleSubmitPredictions}>
            {createPredictions.isPending ? 'Creating...' : 'Create Predictions'}
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default CartDropdown
