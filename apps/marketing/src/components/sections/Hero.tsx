import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Zap, ChevronRight } from 'lucide-react'
import homeScreenshotLight from '@/assets/home_screenshot_light.png'
import homeScreenshotDark from '@/assets/home_screenshot_dark.png'

interface HeroProps {
  appUrl: string
  onLearnMore: () => void
}

export function Hero({ appUrl, onLearnMore }: HeroProps) {
  return (
    <section className='relative overflow-hidden py-20 sm:py-32'>
      {/* Background Sports Image */}
      <div className='absolute inset-0 -z-10 opacity-5'>
        <img src='/hero/stadium-bg.jpg' alt='' className='w-full h-full object-cover' />
      </div>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='grid lg:grid-cols-2 gap-12 items-center'>
          {/* Left Side - Text Content */}
          <div className='text-center lg:text-left'>
            <Badge variant='secondary' className='mb-4'>
              <Zap className='h-3 w-3' />
              100% Free. Zero Risk. Pure Glory.
            </Badge>
            <h1 className='text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6'>
              Think You Know Sports?
              <br />
              <span className='text-primary'>Prove It.</span>
            </h1>
            <p className='text-xl text-muted-foreground mb-8'>Call your shots. Stack points. Own the leaderboard.</p>
            <div className='flex flex-col sm:flex-row lg:justify-start justify-center gap-4'>
              <Button asChild size='lg' className='text-lg px-8'>
                <a href={appUrl} target='_blank' rel='noopener noreferrer'>
                  Start Playing
                  <ChevronRight className='ml-2 h-5 w-5' />
                </a>
              </Button>
              <Button size='lg' variant='outline' className='text-lg px-8' onClick={onLearnMore}>
                How Does This Work?
              </Button>
            </div>
          </div>

          {/* Right Side - App Screenshot */}
          <div className='relative'>
            <div className='rounded-xl border bg-card shadow-2xl overflow-hidden'>
              <img
                src={homeScreenshotLight}
                alt='Pulse app home dashboard screenshot'
                className='w-full h-auto block dark:hidden'
              />
              <img
                src={homeScreenshotDark}
                alt='Pulse app home dashboard screenshot'
                className='w-full h-auto hidden dark:block'
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
