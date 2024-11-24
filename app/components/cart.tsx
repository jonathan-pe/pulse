'use client'

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/app/components/ui/sheet'
import { Button } from './ui/button'
import { CircleX, ShoppingCartIcon } from 'lucide-react'
import { Badge } from './ui/badge'
import useCart from '../hooks/use-cart'
import { Card } from './ui/card'
import { useAppStore } from '../store'

const Cart = () => {
  const { cart, removeFromCart } = useCart()
  const userStats = useAppStore((state) => state.userStats)

  return (
    <Sheet>
      <SheetTrigger className='flex gap-2 justify-center items-center hover:bg-muted p-2 rounded-[--radius]'>
        <ShoppingCartIcon width={24} height={24} />
        <Badge className='pointer-events-none'>{cart?.length ?? 0}</Badge>
      </SheetTrigger>
      <SheetContent className='overflow-auto p-0 flex flex-col gap-0'>
        <SheetHeader className='p-4 border-b border-b-border'>
          <SheetTitle>Pending Predictions</SheetTitle>
        </SheetHeader>
        <div className='flex flex-col gap-4 overflow-auto p-4 flex-1 min-h-0'>
          {cart?.map((odd) => (
            <Card key={odd.id} className='flex items-center justify-between px-4 py-2 gap-4'>
              <div className='flex justify-center text-sm flex-col flex-1'>
                <span className='mb-2'>{odd.name}</span>
                <span className='text-muted-foreground text-xs'>{odd.market}</span>
                <span className='text-muted-foreground text-xs'>{odd.event}</span>
              </div>
              <div>
                <span className='font-semibold'>{odd.price}</span>
              </div>
              <Button onClick={() => removeFromCart(odd.id)} variant='destructiveGhost' size='icon'>
                <CircleX width={16} height={16} />
              </Button>
            </Card>
          ))}
        </div>
        <SheetFooter className='sticky bottom-0 bg-background p-4 border-t border-t-border'>
          <div className='flex items-center justify-between w-full'>
            <div className='flex flex-col text-sm'>
              <span>Bonus Predictions Left: {userStats?.daily_prediction_count}</span>
            </div>
            <SheetClose asChild>
              <Button type='submit'>Confirm</Button>
            </SheetClose>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export default Cart
