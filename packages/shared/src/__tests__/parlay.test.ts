import { describe, expect, it } from 'vitest'
import {
  combinedIndependentImpliedPercentFromAmericanOdds,
  multiplyLegImpliedProbabilities,
  previewMultiGameParlayPoints,
  sgpAdjustedImpliedPercent,
} from '../parlay'

describe('parlay helpers', () => {
  it('multiplies leg implied percents (independence)', () => {
    expect(multiplyLegImpliedProbabilities([50, 50])).toBeCloseTo(25, 5)
    expect(combinedIndependentImpliedPercentFromAmericanOdds([100, 100])).toBeCloseTo(25, 1)
  })

  it('previewMultiGameParlayPoints returns win > single -110 leg', () => {
    const twoLegs = previewMultiGameParlayPoints([-110, -110])
    expect(twoLegs.combinedImpliedPercent).toBeLessThan(52.5)
    expect(twoLegs.winPointsRounded).toBeGreaterThan(19)
  })

  it('sgpAdjustedImpliedPercent bumps naive combined', () => {
    const naive = 20
    expect(sgpAdjustedImpliedPercent(naive)).toBeGreaterThan(naive)
  })
})
