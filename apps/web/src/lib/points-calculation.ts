/**
 * Points Calculation Utilities (Client-side)
 *
 * These functions mirror the backend point calculation logic.
 * Used for showing point previews before predictions are submitted.
 */

/**
 * Calculate implied probability from American odds
 *
 * @param odds - American odds format (e.g., -150, +200)
 * @returns Implied win probability as a percentage (0-100)
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
 * Points are inversely proportional to win probability.
 * Formula: 10 × (100 / ImpliedProbability)
 *
 * @param odds - American odds format (e.g., -150, +200)
 * @returns Base points (before bonuses/diminishing returns)
 */
export function calculateBasePoints(odds: number): number {
  const impliedProb = calculateImpliedProbability(odds)
  return 10 * (100 / impliedProb)
}

/**
 * Calculate point loss for an incorrect prediction
 *
 * Loss scales with implied probability - easier picks cost more when missed.
 * Formula: -1 × LOSS_MULTIPLIER × (ImpliedProbability / 10)
 *
 * @param odds - American odds format (e.g., -150, +200)
 * @returns Negative points to deduct
 */
export function calculateIncorrectPoints(odds: number): number {
  const LOSS_MULTIPLIER = 0.5 // Must match backend configuration
  const impliedProb = calculateImpliedProbability(odds)
  return -1 * LOSS_MULTIPLIER * (impliedProb / 10)
}

/**
 * Calculate points for a prediction outcome (correct or incorrect)
 *
 * @param odds - American odds format
 * @param isCorrect - Whether the prediction was correct
 * @returns Points awarded (positive) or deducted (negative)
 */
export function calculatePointsForOutcome(odds: number, isCorrect: boolean): number {
  if (isCorrect) {
    return calculateBasePoints(odds)
  } else {
    return calculateIncorrectPoints(odds)
  }
}
