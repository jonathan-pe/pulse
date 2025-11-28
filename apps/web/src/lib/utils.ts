import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Returns consistent badge color classes for league badges across the application.
 * @param league - The league code (NFL, NBA, MLB, NHL, etc.)
 * @returns Tailwind CSS classes for badge styling
 */
export function getLeagueBadgeColor(league: string): string {
  switch (league.toUpperCase()) {
    case 'NFL':
      return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20'
    case 'NBA':
      return 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20'
    case 'MLB':
      return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20'
    case 'NHL':
      return 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20'
    default:
      return ''
  }
}
