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
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='text-center mb-12'>
          <Badge variant='secondary' className='mb-4'>
            <Zap className='h-3 w-3' />
            No Real Money. No Gambling. Just Predictions.
          </Badge>
          <h1 className='text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6'>
            Test Your Sports
            <br />
            <span className='text-primary'>Prediction Skills</span>
          </h1>
          <p className='text-xl text-muted-foreground max-w-3xl mx-auto mb-8'>
            Make predictions on real sporting events, earn points based on probability, and compete on leaderboards.
            Pure skill-based competition without any real money or gambling.
          </p>
          <div className='flex flex-col sm:flex-row justify-center gap-4'>
            <Button asChild size='lg' className='text-lg px-8'>
              <a href={appUrl} target='_blank' rel='noopener noreferrer'>
                Start Predicting Free
                <ChevronRight className='ml-2 h-5 w-5' />
              </a>
            </Button>
            <Button size='lg' variant='outline' className='text-lg px-8' onClick={onLearnMore}>
              Learn How It Works
            </Button>
          </div>
        </div>

        {/* Hero Image */}
        <div className='relative max-w-5xl mx-auto'>
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
    </section>
  )
}
