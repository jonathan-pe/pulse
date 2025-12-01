import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SidebarTrigger } from '@/components/ui/sidebar'
import useCartStore from '@/store/cart'
import BetSlipSidebar from '@/components/cart/BetSlipSidebar'

export default function AppHeader() {
  const selections = useCartStore((s) => s.selections)
  const toggleCart = useCartStore((s) => s.toggleCart)

  return (
    <>
      <header className='sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
        <div className='flex h-16 items-center gap-4 px-4'>
          {/* Sidebar Trigger */}
          <SidebarTrigger />

          {/* Page Title/Breadcrumb Area - can be customized per page */}
          <div className='flex-1' />

          {/* Right side actions */}
          <div className='flex items-center gap-2'>
            {/* Bet Slip Button with Badge */}
            <Button variant='ghost' size='icon' onClick={toggleCart} aria-label='Open bet slip' className='relative'>
              <ShoppingCart />
              {selections.length > 0 && (
                <Badge className='absolute -right-1 -top-1 h-5 min-w-5 items-center justify-center rounded-full p-0 text-xs'>
                  {selections.length}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Bet Slip Sidebar */}
      <BetSlipSidebar />
    </>
  )
}
