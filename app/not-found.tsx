import React from 'react'
import { Button } from '@/app/components/ui/button'
import Link from 'next/link'

const NotFoundPage = () => {
  return (
    <div className='flex min-h-screen flex-col items-center justify-center'>
      <h1 className='text-4xl font-bold'>404 - Page Not Found</h1>
      <p className='mt-4 text-lg'>Oops! The page you are looking for does not exist.</p>
      <Button variant='link'>
        <Link href='/'>Go back to Home</Link>
      </Button>
    </div>
  )
}

export default NotFoundPage
