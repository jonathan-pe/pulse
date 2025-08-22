// apps/web/src/components/ui/button.tsx
import * as React from 'react'
import { cn } from './utils'

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>

export function Button({ className, ...props }: ButtonProps) {
  return (
    <button
      className={cn('px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-medium transition', className)}
      {...props}
    />
  )
}
