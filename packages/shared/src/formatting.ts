/**
 * Formatting Utilities
 *
 * Shared formatting functions for consistent display across applications.
 * Pure functions with no side effects.
 */

/**
 * Format American odds for display
 *
 * Ensures consistent formatting with explicit + or - sign.
 * Used across game cards, bet slips, and prediction displays.
 *
 * @param odds - American odds format (e.g., -150, +200)
 * @returns Formatted string with sign (e.g., "-150", "+200")
 *
 * @example
 * formatOdds(-150) // Returns "-150"
 * formatOdds(200)  // Returns "+200"
 * formatOdds(100)  // Returns "+100"
 */
export function formatOdds(odds: number): string {
  return odds > 0 ? `+${odds}` : `${odds}`
}

/**
 * Format date for display in user's timezone
 *
 * @param date - Date string or Date object
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 *
 * @example
 * formatDate('2025-12-09T19:00:00Z') // Returns "Dec 9, 2025"
 * formatDate(new Date(), { timeStyle: 'short' }) // Returns "2:30 PM"
 */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', options).format(dateObj)
}

/**
 * Format game time for display
 *
 * Shows relative time for upcoming games, or status for live/completed games.
 *
 * @param startsAt - Game start time (ISO string or Date)
 * @param status - Game status ('scheduled', 'live', 'final')
 * @returns Formatted time string
 *
 * @example
 * formatGameTime('2025-12-09T19:00:00Z', 'scheduled') // Returns "Today at 2:00 PM"
 * formatGameTime('2025-12-09T19:00:00Z', 'live')      // Returns "Live"
 * formatGameTime('2025-12-09T19:00:00Z', 'final')     // Returns "Final"
 */
export function formatGameTime(startsAt: string | Date, status?: string): string {
  if (status === 'live') return 'Live'
  if (status === 'final') return 'Final'

  const date = typeof startsAt === 'string' ? new Date(startsAt) : startsAt
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)

  // Within 24 hours - show "Today at X:XX PM"
  if (diffHours >= 0 && diffHours < 24) {
    const time = formatDate(date, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    return `Today at ${time}`
  }

  // Within 48 hours - show "Tomorrow at X:XX PM"
  if (diffHours >= 24 && diffHours < 48) {
    const time = formatDate(date, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    return `Tomorrow at ${time}`
  }

  // Further out - show "Mon, Dec 9 at X:XX PM"
  return formatDate(date, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

/**
 * Format win rate as percentage
 *
 * @param wins - Number of wins
 * @param total - Total predictions
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string
 *
 * @example
 * formatWinRate(15, 20)    // Returns "75.0%"
 * formatWinRate(2, 3, 2)   // Returns "66.67%"
 * formatWinRate(0, 0)      // Returns "0.0%"
 */
export function formatWinRate(wins: number, total: number, decimals: number = 1): string {
  if (total === 0) return '0.0%'
  const percentage = (wins / total) * 100
  return `${percentage.toFixed(decimals)}%`
}

/**
 * Format points with sign
 *
 * Shows + for positive, - for negative, explicit for better UX.
 *
 * @param points - Point value
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted point string with sign
 *
 * @example
 * formatPoints(15.5)   // Returns "+15.5"
 * formatPoints(-3.2)   // Returns "-3.2"
 * formatPoints(0)      // Returns "+0.0"
 */
export function formatPoints(points: number, decimals: number = 1): string {
  const formatted = points.toFixed(decimals)
  return points >= 0 ? `+${formatted}` : formatted
}
