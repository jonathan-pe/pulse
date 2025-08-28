import { Link } from '@tanstack/react-router'
import ThemeToggle from '@/components/ui/theme-toggle'
import { Button } from '@/components/ui/button'

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
            <Link to='/' className='px-2 py-1 rounded hover:bg-accent/60 [ &.active ]:font-semibold'>
              Home
            </Link>
            <Link to='/about' className='px-2 py-1 rounded hover:bg-accent/60 [ &.active ]:font-semibold'>
              About
            </Link>
          </nav>

          <div className='ml-auto flex items-center gap-2'>
            <div className='hidden sm:flex items-center gap-2'>
              <Link to='/login'>
                <Button variant='ghost' size='sm'>
                  Log in
                </Button>
              </Link>
            </div>

            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}
