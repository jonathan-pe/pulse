/**
 * Points Calculation Utilities
 *
 * Pure mathematical functions for calculating points based on odds and streaks.
 * These functions implement the probability-based scoring system that ensures
 * fair expected value across all odds ranges.
 */

/**
 * Calculate implied probability from American odds
 *
 * @param odds - American odds format (e.g., -150, +200)
 * @returns Implied win probability as a percentage (0-100)
 *
 * @example
 * calculateImpliedProbability(-150) // Returns 60.0 (60% favorite)
 * calculateImpliedProbability(+200) // Returns 33.3 (33% underdog)
 */
export function calculateImpliedProbability(odds: number): number {
  if (odds < 0) {
    // Favorite: |odds| / (|odds| + 100) × 100
    return (Math.abs(odds) / (Math.abs(odds) + 100)) * 100
  } else {
    // Underdog: 100 / (odds + 100) × 100
    return (100 / (odds + 100)) * 100
  }
}

/**
 * Calculate base points for a prediction based on odds
 *
 * Points are inversely proportional to win probability, ensuring equal
 * expected value across all odds ranges.
 *
 * Formula: 10 × (100 / ImpliedProbability)
 *
 * @param odds - American odds format (e.g., -150, +200)
 * @returns Base points (before streak bonuses)
 *
 * @example
 * calculateBasePoints(-150) // Returns 16.67 points (60% favorite)
 * calculateBasePoints(+200) // Returns 30.0 points (33% underdog)
 * calculateBasePoints(-500) // Returns 12.0 points (83% heavy favorite)
 */
export function calculateBasePoints(odds: number): number {
  const impliedProb = calculateImpliedProbability(odds)
  return 10 * (100 / impliedProb)
}

/**
 * Get streak bonus points based on current streak length
 *
 * @deprecated Streaks are now cosmetic only and don't affect point scoring.
 * This function is kept for backward compatibility but always returns 0.
 * Streak tracking continues for achievement purposes.
 *
 * @param streakLength - Number of consecutive correct predictions
 * @returns Always returns 0 (streaks are cosmetic only)
 */
export function getStreakBonus(streakLength: number): number {
  // Streaks are now purely cosmetic achievements
  // No longer affect point calculations
  return 0
}

/**
 * Calculate total points for a correct prediction
 *
 * Pure probability-based scoring with no bonuses or multipliers.
 * Streaks are tracked separately for cosmetic achievements only.
 *
 * @param odds - American odds format
 * @returns Total points earned (base points only)
 *
 * @example
 * calculateTotalPoints(-150) // Returns 16.67
 * calculateTotalPoints(+300) // Returns 40
 */
export function calculateTotalPoints(odds: number): number {
  return calculateBasePoints(odds)
}

/**
 * Apply diminishing returns based on daily prediction count
 *
 * Implements soft cap system to discourage excessive volume:
 * - Predictions 1-15: 100% of points
 * - Predictions 16-40: 50% of points
 * - Predictions 41+: 0% of points
 *
 * @param points - Calculated points before diminishing returns
 * @param dailyPredictionCount - Number of predictions made today (1-indexed)
 * @returns Points after applying diminishing returns
 *
 * @example
 * applyDiminishingReturns(20, 10) // Returns 20 (within first 15)
 * applyDiminishingReturns(20, 25) // Returns 10 (50% reduction)
 * applyDiminishingReturns(20, 45) // Returns 0 (hard cap)
 */
export function applyDiminishingReturns(points: number, dailyPredictionCount: number): number {
  if (dailyPredictionCount <= 15) {
    return points // Full points
  } else if (dailyPredictionCount <= 40) {
    return points * 0.5 // 50% of points
  } else {
    return 0 // No points
  }
}
