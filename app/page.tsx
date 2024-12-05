import { Button } from '@/app/components/ui/button'
import Link from 'next/link'

export default function Home() {
  return (
    <div className='mx-auto flex min-h-screen w-full flex-col p-4'>
      <header className='flex items-center justify-between'>
        <span className='text-2xl font-bold'>Pulse</span>
        <Button>
          <Link href='/login'>Login</Link>
        </Button>
      </header>
      <main className='flex h-full flex-1 flex-col items-center justify-center'>
        <h1 className='mb-4 text-4xl font-bold'>Welcome to Pulse</h1>
        <p>Gamified sports predictions without real money or prizes</p>
      </main>
    </div>
  )
}
