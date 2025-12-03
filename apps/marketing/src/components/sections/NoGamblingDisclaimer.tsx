import { Shield } from 'lucide-react'

export function NoGamblingDisclaimer() {
  return (
    <section className='py-12 bg-muted/50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex items-start gap-4 max-w-4xl mx-auto'>
          <Shield className='h-6 w-6 text-primary shrink-0 mt-1' />
          <div>
            <h3 className='text-lg font-semibold mb-2'>100% Legal & Compliant</h3>
            <p className='text-muted-foreground'>
              Pulse is <strong>not sports betting or gambling</strong>. No real money is involved, no prizes are
              awarded, and no financial transactions occur. We're a skill-based prediction platform for entertainment
              and friendly competition only. Safe, legal, and fun for all sports enthusiasts.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
