import { PulseError } from '@/types/error'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const { error } = await res.json()
    throw new PulseError(error.message ?? 'An error occurred', error.description ?? 'Please try again.', res.status)
  }

  return res.json()
}
