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
 * Number of bonus tier predictions allowed per day (default)
 *
 * Bonus tier predictions receive a multiplier before diminishing returns.
 * This creates daily engagement without dailies fatigue.
 *
 * Can be overridden via:
 * - Environment: DAILY_BONUS_TIER_LIMIT=2
 * - Database: ConfigService.getDailyBonusTierLimit()
 */
export const DEFAULT_DAILY_BONUS_TIER_LIMIT = 1

/**
 * Total maximum predictions allowed per day (default)
 *
 * Hard cap to prevent abuse while allowing casual engagement.
 * Works with diminishing returns system for soft caps.
 *
 * Can be overridden via:
 * - Environment: DAILY_TOTAL_LIMIT=50
 * - Database: ConfigService.getDailyTotalLimit()
 */
export const DEFAULT_DAILY_TOTAL_LIMIT = 40

/**
 * Point multiplier for bonus tier predictions (default)
 *
 * Applied to base points before diminishing returns.
 * 1.5x encourages daily engagement without being overpowered.
 *
 * Can be overridden via:
 * - Environment: BONUS_TIER_MULTIPLIER=2.0
 * - Database: ConfigService.getBonusTierMultiplier()
 */
export const DEFAULT_BONUS_TIER_MULTIPLIER = 1.5

/**
 * Point loss multiplier for incorrect predictions (default)
 *
 * Scales the penalty for missed predictions.
 * 0.5 creates moderate penalties that maintain engagement.
 *
 * Can be overridden via:
 * - Environment: LOSS_MULTIPLIER=0.75
 * - Database: ConfigService.getLossMultiplier()
 */
export const DEFAULT_LOSS_MULTIPLIER = 0.5

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

/**
 * Soft cap threshold - Full points (100%) up to this count
 *
 * Predictions 1-15 earn full points.
 * Part of the diminishing returns system.
 *
 * Can be overridden via:
 * - Environment: SOFT_CAP_THRESHOLD=20
 * - Database: ConfigService.getSoftCapThreshold()
 */
export const DEFAULT_SOFT_CAP_THRESHOLD = 15

/**
 * Hard cap threshold - Zero points after this count
 *
 * Predictions 41+ earn zero points.
 * Should be greater than DAILY_TOTAL_LIMIT to prevent confusion.
 *
 * Can be overridden via:
 * - Environment: HARD_CAP_THRESHOLD=50
 * - Database: ConfigService.getHardCapThreshold()
 */
export const DEFAULT_HARD_CAP_THRESHOLD = 40

// Convenience exports (for backward compatibility and simpler imports)
// These can be used directly in code that doesn't need dynamic config

/** @deprecated Use DEFAULT_DAILY_BONUS_TIER_LIMIT for clarity. Kept for backward compatibility. */
export const DAILY_BONUS_TIER_LIMIT = DEFAULT_DAILY_BONUS_TIER_LIMIT

/** @deprecated Use DEFAULT_DAILY_TOTAL_LIMIT for clarity. Kept for backward compatibility. */
export const DAILY_TOTAL_LIMIT = DEFAULT_DAILY_TOTAL_LIMIT

/** @deprecated Use DEFAULT_BONUS_TIER_MULTIPLIER for clarity. Kept for backward compatibility. */
export const BONUS_TIER_MULTIPLIER = DEFAULT_BONUS_TIER_MULTIPLIER

/** @deprecated Use DEFAULT_LOSS_MULTIPLIER for clarity. Kept for backward compatibility. */
export const LOSS_MULTIPLIER = DEFAULT_LOSS_MULTIPLIER

/** @deprecated Use DEFAULT_STREAK_HIGHLIGHT_THRESHOLD for clarity. Kept for backward compatibility. */
export const STREAK_HIGHLIGHT_THRESHOLD = DEFAULT_STREAK_HIGHLIGHT_THRESHOLD
