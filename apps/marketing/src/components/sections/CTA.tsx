import { Button } from '@/components/ui/button'
import { ChevronRight } from 'lucide-react'

interface CTAProps {
  appUrl: string
}

export function CTA({ appUrl }: CTAProps) {
  return (
    <section className='py-20 sm:py-32 bg-primary/5'>
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center'>
        <h2 className='text-3xl sm:text-4xl font-bold mb-4'>Ready to Start Predicting?</h2>
        <p className='text-xl text-muted-foreground mb-8'>
          Join Pulse today and test your sports prediction skills against others. No credit card required.
        </p>
        <Button asChild size='lg' className='text-lg px-8'>
          <a href={appUrl} target='_blank' rel='noopener noreferrer'>
            Get Started Free
            <ChevronRight className='ml-2 h-5 w-5' />
          </a>
        </Button>
      </div>
    </section>
  )
}
