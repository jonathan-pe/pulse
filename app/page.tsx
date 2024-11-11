import { Button } from '@/app/components/ui/button'
import Link from 'next/link'

export default function Home() {
  return (
    <div className='flex flex-col mx-auto w-full min-h-screen p-4'>
      <header className='flex items-center justify-between'>
        <span className='text-2xl font-bold'>Pulse</span>
        <Button>
          <Link href='/login'>Login</Link>
        </Button>
      </header>
      <main className='flex flex-1 justify-center items-center flex-col h-full'>
        <h1 className='text-4xl font-bold mb-4'>Welcome to Pulse</h1>
        <p>Gamified sports predictions without real money or prizes</p>
      </main>
    </div>
  )
}
