/**
 * Parlay pricing and points (multi-game independence + simple SGP adjustment).
 * See docs/specs/parlays-and-same-game-parlays.md
 */

import { DEFAULT_LOSS_MULTIPLIER } from './constants'
import { calculateImpliedProbability } from './points'

/**
 * Combined implied win probability (percent 0–100) for independent legs.
 */
export function multiplyLegImpliedProbabilities(impliedPercents: number[]): number {
  if (impliedPercents.length === 0) {
    throw new Error('Parlay must have at least one leg')
  }
  let product = 1
  for (const p of impliedPercents) {
    product *= p / 100
  }
  return product * 100
}

/**
 * Win points from combined implied probability (same EV shape as singles base points).
 */
export function calculateBasePointsFromImpliedPercent(impliedPercent: number): number {
  if (impliedPercent <= 0 || impliedPercent > 100) {
    throw new Error(`Invalid combined implied probability: ${impliedPercent}`)
  }
  return 10 * (100 / impliedPercent)
}

/**
 * Loss points from combined implied probability (same shape as calculateIncorrectPoints).
 */
export function calculateIncorrectPointsFromImpliedPercent(
  impliedPercent: number,
  lossMultiplier: number = DEFAULT_LOSS_MULTIPLIER
): number {
  return -1 * lossMultiplier * (impliedPercent / 10)
}

/**
 * American odds for each leg → combined independent implied % (percent scale).
 */
export function combinedIndependentImpliedPercentFromAmericanOdds(americanOdds: number[]): number {
  const percents = americanOdds.map((o) => calculateImpliedProbability(o))
  return multiplyLegImpliedProbabilities(percents)
}

/**
 * v1 SGP adjustment: raise effective joint probability vs naive independence
 * (positively correlated legs hit together more often than product of marginals).
 */
export function sgpAdjustedImpliedPercent(
  naiveCombinedPercent: number,
  _pricingVersion: string = 'parlay-sgp-v1'
): number {
  const bumped = naiveCombinedPercent * 1.12
  return Math.min(bumped, 92)
}

export interface ParlayPointsPreview {
  combinedImpliedPercent: number
  winPointsRounded: number
  lossPoints: number
}

export function previewMultiGameParlayPoints(
  legAmericanOdds: number[],
  lossMultiplier: number = DEFAULT_LOSS_MULTIPLIER
): ParlayPointsPreview {
  const combined = combinedIndependentImpliedPercentFromAmericanOdds(legAmericanOdds)
  const winPointsRounded = Math.round(calculateBasePointsFromImpliedPercent(combined))
  const lossPoints = calculateIncorrectPointsFromImpliedPercent(combined, lossMultiplier)
  return {
    combinedImpliedPercent: combined,
    winPointsRounded,
    lossPoints,
  }
}

export function previewSameGameParlayPoints(
  legAmericanOdds: number[],
  lossMultiplier: number = DEFAULT_LOSS_MULTIPLIER,
  pricingVersion?: string
): ParlayPointsPreview {
  const naive = combinedIndependentImpliedPercentFromAmericanOdds(legAmericanOdds)
  const combined = sgpAdjustedImpliedPercent(naive, pricingVersion)
  const winPointsRounded = Math.round(calculateBasePointsFromImpliedPercent(combined))
  const lossPoints = calculateIncorrectPointsFromImpliedPercent(combined, lossMultiplier)
  return {
    combinedImpliedPercent: combined,
    winPointsRounded,
    lossPoints,
  }
}
