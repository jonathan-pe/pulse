/**
 * Application Constants
 *
 * These constants should match the backend business rules.
 * Keep in sync with apps/api/src/services/predictions.service.ts
 */

/**
 * Number of bonus tier predictions allowed per day
 * Bonus tier predictions receive a 1.5x point multiplier
 */
export const DAILY_BONUS_TIER_LIMIT = 1

/**
 * Total maximum predictions allowed per day
 */
export const DAILY_TOTAL_LIMIT = 40

/**
 * Minimum streak length to highlight with special styling
 */
export const STREAK_HIGHLIGHT_THRESHOLD = 3
