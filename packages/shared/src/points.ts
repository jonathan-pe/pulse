/**
 * Points Calculation Utilities
 *
 * Pure mathematical functions for calculating points based on odds.
 * These implement the probability-based scoring system that ensures
 * fair expected value across all odds ranges.
 *
 * Design: Pure functions with no side effects or external dependencies.
 * Can be called from frontend (previews) or backend (scoring) safely.
 */

import { DEFAULT_LOSS_MULTIPLIER } from './constants'

/**
 * Calculate implied probability from American odds
 *
 * Converts American odds format into a win probability percentage.
 * This is the foundation for probability-based point calculations.
 *
 * @param odds - American odds format (e.g., -150, +200)
 * @returns Implied win probability as a percentage (0-100)
 *
 * @example
 * calculateImpliedProbability(-150) // Returns 60.0 (60% favorite)
 * calculateImpliedProbability(+200) // Returns 33.3 (33% underdog)
 * calculateImpliedProbability(-500) // Returns 83.3 (83% heavy favorite)
 * calculateImpliedProbability(+700) // Returns 12.5 (12.5% longshot)
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
 * Calculate base points for a correct prediction based on odds
 *
 * Points are inversely proportional to win probability, ensuring equal
 * expected value across all odds ranges. This creates a fair system where
 * no strategy (favorites vs underdogs) has inherent advantage.
 *
 * Formula: 10 × (100 / ImpliedProbability)
 *
 * @param odds - American odds format (e.g., -150, +200)
 * @returns Base points for a correct pick at these odds
 *
 * @example
 * calculateBasePoints(-500) // Returns 12.0 (83% heavy favorite)
 * calculateBasePoints(-150) // Returns 16.67 (60% favorite)
 * calculateBasePoints(-110) // Returns 19.0 (52% pick'em)
 * calculateBasePoints(+200) // Returns 30.0 (33% underdog)
 * calculateBasePoints(+700) // Returns 80.0 (12.5% longshot)
 */
export function calculateBasePoints(odds: number): number {
  const impliedProb = calculateImpliedProbability(odds)
  return 10 * (100 / impliedProb)
}

/**
 * Calculate point loss for an incorrect prediction
 *
 * Loss scales with implied probability - easier picks cost more when missed.
 * This creates a risk/reward balance where favorites have higher penalties
 * but lower rewards, while underdogs have minimal penalties but high rewards.
 *
 * Formula: -1 × LOSS_MULTIPLIER × (ImpliedProbability / 10)
 *
 * @param odds - American odds format (e.g., -150, +200)
 * @param lossMultiplier - Optional override for loss scaling (defaults to DEFAULT_LOSS_MULTIPLIER)
 * @returns Negative points to deduct
 *
 * @example
 * // With default LOSS_MULTIPLIER = 0.5
 * calculateIncorrectPoints(-500) // Returns -4.2 (83% favorite missed)
 * calculateIncorrectPoints(-200) // Returns -3.3 (67% favorite missed)
 * calculateIncorrectPoints(-110) // Returns -2.6 (52% pick'em missed)
 * calculateIncorrectPoints(+300) // Returns -1.25 (25% underdog missed)
 * calculateIncorrectPoints(+700) // Returns -0.63 (12.5% longshot missed)
 *
 * @example
 * // With custom multiplier for testing or admin override
 * calculateIncorrectPoints(-200, 1.0) // Returns -6.7 (doubled penalty)
 */
export function calculateIncorrectPoints(odds: number, lossMultiplier: number = DEFAULT_LOSS_MULTIPLIER): number {
  const impliedProb = calculateImpliedProbability(odds)
  return -1 * lossMultiplier * (impliedProb / 10)
}

/**
 * Calculate points for a prediction outcome (correct or incorrect)
 *
 * Unified function that handles both winning and losing points.
 * This is the main entry point for point calculations.
 *
 * @param odds - American odds format
 * @param isCorrect - Whether the prediction was correct
 * @param lossMultiplier - Optional override for loss scaling (defaults to DEFAULT_LOSS_MULTIPLIER)
 * @returns Points awarded (positive) or deducted (negative)
 *
 * @example
 * calculatePointsForOutcome(-200, true)  // Returns +15 (correct favorite)
 * calculatePointsForOutcome(-200, false) // Returns -3.3 (incorrect favorite)
 * calculatePointsForOutcome(+300, true)  // Returns +40 (correct underdog)
 * calculatePointsForOutcome(+300, false) // Returns -1.25 (incorrect underdog)
 *
 * @example
 * // With custom loss multiplier (e.g., from admin config)
 * calculatePointsForOutcome(-200, false, 1.0) // Returns -6.7 (doubled penalty)
 */
export function calculatePointsForOutcome(odds: number, isCorrect: boolean, lossMultiplier?: number): number {
  if (isCorrect) {
    return calculateBasePoints(odds)
  } else {
    return calculateIncorrectPoints(odds, lossMultiplier)
  }
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
 * @deprecated Use calculatePointsForOutcome instead for unified interface.
 * Kept for backward compatibility.
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
