/**
 * League Badge Colors
 *
 * Provides consistent Tailwind CSS color classes for league badges.
 * Used across game cards, predictions, and dashboard components.
 */

/**
 * Get Tailwind CSS classes for league badge styling
 *
 * @param league - League code (NFL, NBA, MLB, NHL, etc.)
 * @returns Tailwind CSS classes for badge styling
 *
 * @example
 * getLeagueBadgeColor('NFL') // Returns 'bg-red-100 text-red-800 ...'
 * getLeagueBadgeColor('NBA') // Returns 'bg-orange-100 text-orange-800 ...'
 */
export function getLeagueBadgeColor(league: string): string {
  const leagueUpper = league.toUpperCase()

  switch (leagueUpper) {
    case 'NFL':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    case 'NBA':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
    case 'MLB':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    case 'NHL':
      return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
  }
}
