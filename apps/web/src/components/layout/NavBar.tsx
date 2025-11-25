import { Link } from '@tanstack/react-router'
import { ShoppingCart } from 'lucide-react'
import AccountMenu from '@/components/layout/AccountMenu'
import ThemeToggle from '@/components/ui/theme-toggle'
import BetSlipSidebar from '@/components/cart/BetSlipSidebar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import useCartStore from '@/store/cart'

export default function Navbar() {
  const selections = useCartStore((s) => s.selections)
  const toggleCart = useCartStore((s) => s.toggleCart)

  return (
    <>
      <header className='w-full border-b bg-background/50 backdrop-blur-sm'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='h-14 flex items-center gap-4'>
            <Link to='/' className='flex items-center gap-3'>
              <img src='/pulse_logo.png' alt='Pulse' className='h-8 w-auto' />
              <span className='font-semibold text-lg'>Pulse</span>
            </Link>

            <nav className='ml-6 hidden md:flex items-center gap-4 text-sm'>
              <Link
                to='/leagues/$league'
                params={{ league: 'nfl' }}
                className='px-2 py-1 rounded hover:bg-accent/60 [ &.active ]:font-semibold'
              >
                NFL
              </Link>

              <Link
                to='/leagues/$league'
                params={{ league: 'mlb' }}
                className='px-2 py-1 rounded hover:bg-accent/60 [ &.active ]:font-semibold'
              >
                MLB
              </Link>

              <Link
                to='/leagues/$league'
                params={{ league: 'nba' }}
                className='px-2 py-1 rounded hover:bg-accent/60 [ &.active ]:font-semibold'
              >
                NBA
              </Link>

              <Link
                to='/leagues/$league'
                params={{ league: 'nhl' }}
                className='px-2 py-1 rounded hover:bg-accent/60 [ &.active ]:font-semibold'
              >
                NHL
              </Link>

              <Link to='/predictions' className='px-2 py-1 rounded hover:bg-accent/60 [ &.active ]:font-semibold'>
                My Predictions
              </Link>
            </nav>

            <div className='ml-auto flex items-center gap-2'>
              <ThemeToggle />

              {/* Bet Slip Button with Badge */}
              <Button variant='ghost' size='icon' onClick={toggleCart} aria-label='Open bet slip' className='relative'>
                <ShoppingCart />
                {selections.length > 0 && (
                  <Badge className='absolute -right-1 -top-1 h-5 min-w-5 items-center justify-center rounded-full p-0 text-xs'>
                    {selections.length}
                  </Badge>
                )}
              </Button>

              <AccountMenu />
            </div>
          </div>
        </div>
      </header>

      {/* Bet Slip Sidebar */}
      <BetSlipSidebar />
    </>
  )
}
