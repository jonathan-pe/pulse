import React from 'react'
import { ShoppingCart, XIcon } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import useCartStore from '@/store/cart'
import type { Odd } from '@/store/cart'
import { Button } from '@/components/ui/button'

const CartDropdown: React.FC = () => {
  const odds = useCartStore((s) => s.odds)
  const removeOdds = useCartStore((s) => s.removeOdds)
  const clearCart = useCartStore((s) => s.clearCart)

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
          {odds.length === 0 && <div className='px-2 py-2 text-sm text-muted-foreground'>No selections</div>}
          {odds.map((o: Odd) => {
            // Prefer convenience fields added when the odd is selected
            const team = o.teamName || o.teamName === '' ? o.teamName : undefined
            let betDetail = ''

            // Moneyline
            if (o.market === 'moneyline' || o.market === 'ml') {
              if (o.side === 'home' || o.side === 'away') {
                betDetail = `Moneyline ${o.side === 'home' ? '(Home)' : '(Away)'}${
                  o.selectedOdds ? ` • ${o.selectedOdds}` : ''
                }`
              } else {
                betDetail = `Moneyline${o.selectedOdds ? ` • ${o.selectedOdds}` : ''}`
              }
            }

            // Pointspread
            if (o.market === 'pointspread' || o.market === 'spread') {
              if (o.side === 'home' || o.side === 'away') {
                betDetail = `Spread ${
                  o.selectedOdds != null ? (o.selectedOdds > 0 ? `+${o.selectedOdds}` : `${o.selectedOdds}`) : o.spread
                }`
              } else {
                betDetail = `Spread ${o.selectedOdds != null ? o.selectedOdds : o.spread}`
              }
            }

            // Over/Under
            if (o.market === 'overunder' || o.market === 'totals' || o.market === 'total') {
              if (o.side === 'over' || o.side === 'under') {
                betDetail = `${o.side === 'over' ? 'Over' : 'Under'} ${o.selectedOdds ?? o.total}`
              } else {
                betDetail = `Total ${o.selectedOdds ?? o.total}`
              }
            }

            // Fallback if still empty
            if (!betDetail) {
              betDetail = o.market ?? ''
            }

            return (
              <div
                key={`${o.gameId}-${o.book}-${o.provider}-${o.id}`}
                className='flex items-center justify-between gap-2 px-2 py-1'
              >
                <div className='flex-1'>
                  <div className='text-sm font-medium'>{team ?? o.provider}</div>
                  <div className='text-xs text-muted-foreground'>{betDetail}</div>
                </div>

                <div className='flex items-center gap-2'>
                  <Button
                    variant='destructive'
                    size='icon'
                    onClick={() => {
                      if (o.id) removeOdds(o.id)
                    }}
                  >
                    <XIcon className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

        <DropdownMenuSeparator />
        <div className='flex items-center justify-between gap-2 px-2'>
          <Button variant='ghost' size='sm' onClick={() => clearCart()}>
            Clear
          </Button>
          {/* TODO: implement prediction creation */}
          <Button disabled={odds.length === 0}>Create Prediction</Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default CartDropdown
