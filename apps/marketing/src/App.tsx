import { Button } from '@/components/ui/button'

const WEB_APP_DEV_URL = import.meta.env.VITE_APP_URL || 'http://localhost:5173'

export default function App() {
  return (
    <div id='marketing-root' className='p-8 text-center max-w-4xl mx-auto'>
      <header className='mb-8'>
        <h1 className='text-4xl font-extrabold mb-2'>Pulse</h1>
        <p className='text-lg text-muted-foreground'>Predict, compete, and climb the leaderboards — purely for fun.</p>
      </header>

      <main>
        <section className='bg-card rounded-lg p-8 shadow-lg mb-8'>
          <img src='/pulse_logo.png' alt='Pulse Logo' className='mb-4 w-40 mx-auto' />
          <h2 className='text-2xl font-bold mb-2'>Make predictions. Earn points.</h2>
          <p className='mb-4'>
            Pulse is a gamified sports predictions platform that rewards correct picks based on sportsbook odds. No real
            money, no gambling — just friendly competition.
          </p>
          <div className='flex justify-center gap-4'>
            <Button asChild size='lg'>
              <a href={WEB_APP_DEV_URL + '/login'} target='_blank' rel='noopener noreferrer'>
                Login
              </a>
            </Button>

            <Button asChild variant='outline' size='lg'>
              <a href='#'>Learn more</a>
            </Button>
          </div>
        </section>

        <section className='grid md:grid-cols-3 gap-6 text-left'>
          <article className='p-4 border rounded'>
            <h3 className='font-semibold'>Odds-powered scoring</h3>
            <p className='text-sm text-muted-foreground'>Points scale with sportsbook odds so upsets are worth more.</p>
          </article>
          <article className='p-4 border rounded'>
            <h3 className='font-semibold'>Daily challenges</h3>
            <p className='text-sm text-muted-foreground'>
              Daily prediction caps and bonus tiers encourage repeat play.
            </p>
          </article>
          <article className='p-4 border rounded'>
            <h3 className='font-semibold'>Leaderboards & streaks</h3>
            <p className='text-sm text-muted-foreground'>Track your streaks and compete with friends.</p>
          </article>
        </section>
      </main>
    </div>
  )
}
