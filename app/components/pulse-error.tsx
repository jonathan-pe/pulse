// app/components/Error.tsx
import { Button } from '@/app/components/ui/button'

interface PulseErrorProps {
  message?: string
  onRetry?: () => void
}

export default function PulseError({ message, onRetry }: PulseErrorProps) {
  return (
    <div className='flex h-full flex-col items-center justify-center'>
      <p>{message ?? 'Something went wrong. Please try again or wait until we look into this issue.'}</p>
      {onRetry && (
        <Button onClick={onRetry} className='mt-4'>
          Retry
        </Button>
      )}
    </div>
  )
}
