/**
 * Business Rule Constants (Defaults)
 *
 * These are DEFAULT values that can be overridden by:
 * 1. Environment variables (deploy-time configuration)
 * 2. Database config (runtime configuration via future admin panel)
 *
 * Frontend: Uses these for UI display and hints
 * Backend: Can override with ConfigService for enforcement
 */

/**
 * Hour (UTC) when daily stats/leaderboards reset (default: 10 = 10am UTC)
 *
 * 10am UTC = 5am Eastern / 2am Pacific
 * - Resets during sleep hours for all US timezones
 * - Gives users a full day (morning + evening) to make predictions
 * - Doesn't disrupt prime betting hours (afternoon/evening games)
 * - Still reasonable for international users (6pm JST, 11am CET)
 *
 * Why 5am ET instead of midnight UTC?
 * - US sports gambling market dominates globally
 * - All major leagues (NFL, NBA, MLB, NHL) are US-based
 * - Midnight UTC resets at 7pm ET / 4pm PT (middle of prime time)
 * - 5am ET aligns with natural "start of day" for users
 *
 * Can be overridden via:
 * - Environment: DAILY_RESET_HOUR_UTC=8
 * - Database: ConfigService.getDailyResetHourUTC()
 */
export const DAILY_RESET_HOUR_UTC = 10

/**
 * Total maximum predictions allowed per day (default)
 *
 * Hard cap to prevent abuse while allowing casual engagement.
 *
 * Can be overridden via:
 * - Environment: DAILY_TOTAL_LIMIT=50
 * - Database: ConfigService.getDailyTotalLimit()
 */
export const DEFAULT_DAILY_TOTAL_LIMIT = 40

/**
 * Point loss multiplier for incorrect predictions (default)
 *
 * Scales the penalty for missed predictions relative to implied probability.
 *
 * Can be overridden via:
 * - Environment: LOSS_MULTIPLIER=0.75
 * - Database: ConfigService.getLossMultiplier()
 */
export const DEFAULT_LOSS_MULTIPLIER = 1

/**
 * Minimum streak length to highlight in UI (default)
 *
 * Streaks are cosmetic achievements.
 * This threshold determines when to show special styling.
 *
 * Can be overridden via:
 * - Environment: STREAK_HIGHLIGHT_THRESHOLD=5
 * - Database: ConfigService.getStreakHighlightThreshold()
 */
export const DEFAULT_STREAK_HIGHLIGHT_THRESHOLD = 3

// Convenience exports (for backward compatibility and simpler imports)
// These can be used directly in code that doesn't need dynamic config

/** @deprecated Use DEFAULT_DAILY_TOTAL_LIMIT for clarity. Kept for backward compatibility. */
export const DAILY_TOTAL_LIMIT = DEFAULT_DAILY_TOTAL_LIMIT

/** @deprecated Use DEFAULT_LOSS_MULTIPLIER for clarity. Kept for backward compatibility. */
export const LOSS_MULTIPLIER = DEFAULT_LOSS_MULTIPLIER

/** @deprecated Use DEFAULT_STREAK_HIGHLIGHT_THRESHOLD for clarity. Kept for backward compatibility. */
export const STREAK_HIGHLIGHT_THRESHOLD = DEFAULT_STREAK_HIGHLIGHT_THRESHOLD
