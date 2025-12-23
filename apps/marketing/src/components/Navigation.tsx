import { Button } from '@/components/ui/button'
import ThemeToggle from '@/components/ui/theme-toggle'

interface NavigationProps {
  appUrl: string
  onNavigate: (id: string) => void
}

export function Navigation({ appUrl, onNavigate }: NavigationProps) {
  return (
    <nav className='sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-16'>
          <div className='flex items-center gap-2'>
            <img src='/pulse_logo.png' alt='Pulse Logo' className='h-8 w-8' />
            <span className='text-2xl font-bold'>Pulse</span>
          </div>
          <div className='hidden md:flex items-center gap-6'>
            <button
              onClick={() => onNavigate('features')}
              className='text-sm font-medium text-muted-foreground hover:text-foreground transition-colors'
            >
              Features
            </button>
            <button
              onClick={() => onNavigate('how-it-works')}
              className='text-sm font-medium text-muted-foreground hover:text-foreground transition-colors'
            >
              How It Works
            </button>
            <button
              onClick={() => onNavigate('faq')}
              className='text-sm font-medium text-muted-foreground hover:text-foreground transition-colors'
            >
              FAQ
            </button>
            <ThemeToggle />
            <Button asChild>
              <a href={appUrl} target='_blank' rel='noopener noreferrer'>
                Start Playing
              </a>
            </Button>
          </div>
          <div className='md:hidden flex items-center gap-2'>
            <ThemeToggle />
            <Button asChild size='sm'>
              <a href={appUrl} target='_blank' rel='noopener noreferrer'>
                Start Playing
              </a>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
