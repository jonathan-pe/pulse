import React from 'react'
import { Button } from '@/app/components/ui/button'

const NotFoundPage = () => {
  return (
    <div className='flex flex-col items-center justify-center min-h-screen'>
      <h1 className='text-4xl font-bold'>404 - Page Not Found</h1>
      <p className='mt-4 text-lg'>Oops! The page you are looking for does not exist.</p>
      <Button variant='link'>Go back to Home</Button>
    </div>
  )
}

export default NotFoundPage
