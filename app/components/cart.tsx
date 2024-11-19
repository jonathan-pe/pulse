'use client'

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/app/components/ui/sheet'
import { Button } from './ui/button'
import { ShoppingCartIcon } from 'lucide-react'
import { Badge } from './ui/badge'
import useCart from '../hooks/use-cart'
import { Label } from './ui/label'
import { Input } from './ui/input'

const Cart = () => {
  const { cart, addToCart, removeFromCart } = useCart()
  return (
    <Sheet>
      <SheetTrigger className='flex gap-2 justify-center items-center hover:bg-muted p-2 rounded-[--radius]'>
        <ShoppingCartIcon width={24} height={24} />
        <Badge className='pointer-events-none'>{cart?.length ?? 0}</Badge>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit profile</SheetTitle>
          <SheetDescription>Make changes to your profile here. Click save when you're done.</SheetDescription>
        </SheetHeader>
        <div className='grid gap-4 py-4'>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='name' className='text-right'>
              Name
            </Label>
            <Input id='name' value='Pedro Duarte' className='col-span-3' />
          </div>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='username' className='text-right'>
              Username
            </Label>
            <Input id='username' value='@peduarte' className='col-span-3' />
          </div>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button type='submit'>Save changes</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export default Cart
