import React from 'react'
import { Button } from '../ui/button'

type Props = {
  onClick: () => void
  disabled?: boolean
  children?: React.ReactNode
}

export default function OAuthButton({ onClick, disabled, children }: Props) {
  return (
    <Button onClick={onClick} disabled={disabled} className='w-full' variant='outline'>
      <div className='flex items-center justify-center gap-2 w-full'>{children}</div>
    </Button>
  )
}
