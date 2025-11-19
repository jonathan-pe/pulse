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
 * Flat bonuses (not multipliers) applied equally to all odds ranges.
 * Only applies to Bonus Tier predictions.
 *
 * @param streakLength - Number of consecutive correct predictions
 * @returns Flat bonus points to add
 *
 * @example
 * getStreakBonus(1) // Returns 0 (no bonus for first win)
 * getStreakBonus(2) // Returns 10 (2-win streak)
 * getStreakBonus(5) // Returns 100 (5+ wins, capped)
 */
export function getStreakBonus(streakLength: number): number {
  if (streakLength < 2) return 0
  if (streakLength === 2) return 10
  if (streakLength === 3) return 25
  if (streakLength === 4) return 50
  return 100 // 5+ wins (capped)
}

/**
 * Calculate total points for a correct prediction
 *
 * Combines base points with streak bonus (if applicable).
 *
 * @param odds - American odds format
 * @param streakLength - Current streak length (0 if not bonus tier)
 * @param isBonusTier - Whether this prediction is in the bonus tier
 * @returns Total points earned
 *
 * @example
 * calculateTotalPoints(-150, 0, false) // Returns 16.67 (baseline tier)
 * calculateTotalPoints(-150, 2, true) // Returns 26.67 (bonus tier with 2-win streak)
 * calculateTotalPoints(+300, 3, true) // Returns 65 (40 base + 25 streak)
 */
export function calculateTotalPoints(odds: number, streakLength: number, isBonusTier: boolean): number {
  const basePoints = calculateBasePoints(odds)
  const streakBonus = isBonusTier ? getStreakBonus(streakLength) : 0
  return basePoints + streakBonus
}

/**
 * Apply diminishing returns based on daily prediction count
 *
 * Implements soft cap system to discourage excessive volume:
 * - Predictions 1-30: 100% of points
 * - Predictions 31-75: 50% of points
 * - Predictions 76+: 0% of points
 *
 * @param points - Calculated points before diminishing returns
 * @param dailyPredictionCount - Number of predictions made today (1-indexed)
 * @returns Points after applying diminishing returns
 *
 * @example
 * applyDiminishingReturns(20, 10) // Returns 20 (within first 30)
 * applyDiminishingReturns(20, 50) // Returns 10 (50% reduction)
 * applyDiminishingReturns(20, 80) // Returns 0 (hard cap)
 */
export function applyDiminishingReturns(points: number, dailyPredictionCount: number): number {
  if (dailyPredictionCount <= 30) {
    return points // Full points
  } else if (dailyPredictionCount <= 75) {
    return points * 0.5 // 50% of points
  } else {
    return 0 // No points
  }
}
