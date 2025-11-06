import { Link } from '@tanstack/react-router'
import AccountMenu from '@/routes/_authenticated/-components/AccountMenu'
import ThemeToggle from '@/components/ui/theme-toggle'
import CartDropdown from '@/components/cart/CartDropdown'

export default function Navbar() {
  return (
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

            <CartDropdown />

            <AccountMenu />
          </div>
        </div>
      </div>
    </header>
  )
}
