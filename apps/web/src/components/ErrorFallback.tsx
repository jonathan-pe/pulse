import { Link } from '@tanstack/react-router'

const ErrorFallback = () => {
  return (
    <div className='flex flex-col items-center justify-center min-h-screen space-y-4'>
      <h1 className='text-5xl font-bold'>Error</h1>
      <span className='text-2xl text-muted-foreground'>An unexpected error has occurred.</span>

      <Link to='/' className='text-primary text-xl'>
        Go to Home
      </Link>
    </div>
  )
}

export default ErrorFallback
