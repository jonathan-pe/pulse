import { Link } from '@tanstack/react-router'

const NotFound = () => {
  return (
    <div className='flex flex-col items-center justify-center min-h-screen space-y-4'>
      <h1 className='text-5xl font-bold'>404 - Not Found</h1>
      <span className='text-2xl text-muted-foreground'>The page you are looking for does not exist.</span>

      <Link to='/' className='text-primary text-xl'>
        Go to Home
      </Link>
    </div>
  )
}

export default NotFound
