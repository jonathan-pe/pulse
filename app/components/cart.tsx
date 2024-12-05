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

const Cart = () => {
  const { cart, removeFromCart } = useCart()

  return (
    <Sheet>
      <SheetTrigger className='flex items-center justify-center gap-2 rounded-[--radius] p-2 hover:bg-muted'>
        <ShoppingCartIcon width={24} height={24} />
        <Badge className='pointer-events-none'>{cart?.length ?? 0}</Badge>
      </SheetTrigger>
      <SheetContent className='flex flex-col gap-0 overflow-auto p-0'>
        <SheetHeader className='border-b border-b-border p-4'>
          <SheetTitle>Pending Predictions</SheetTitle>
        </SheetHeader>
        <div className='flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-4'>
          {cart?.map((odd) => (
            <Card key={odd.id} className='flex items-center justify-between gap-4 px-4 py-2'>
              <div className='flex flex-1 flex-col justify-center text-sm'>
                <span className='mb-2'>{odd.name}</span>
                <span className='text-xs text-muted-foreground'>{odd.market}</span>
                <span className='text-xs text-muted-foreground'>{odd.event}</span>
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
        <SheetFooter className='sticky bottom-0 border-t border-t-border bg-background p-4'>
          <div className='flex w-full items-center justify-end'>
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
