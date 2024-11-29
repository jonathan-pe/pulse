import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getSelectionOrderPriority(selection: string): number {
  switch (selection) {
    case 'Away':
      return 1
    case 'Home':
      return 2
    case 'Draw':
      return 3
    default:
      return 4
  }
}
