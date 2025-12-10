import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  calculateImpliedProbability,
  calculateBasePoints,
  calculateIncorrectPoints,
  calculatePointsForOutcome,
  applyDiminishingReturns,
  LOSS_MULTIPLIER,
} from '../points-calculation'

describe('Points Calculation Utilities', () => {
  describe('calculateImpliedProbability', () => {
    it('should calculate probability for favorites (negative odds)', () => {
      expect(calculateImpliedProbability(-500)).toBeCloseTo(83.33, 1)
      expect(calculateImpliedProbability(-200)).toBeCloseTo(66.67, 1)
      expect(calculateImpliedProbability(-110)).toBeCloseTo(52.38, 1)
    })

    it('should calculate probability for underdogs (positive odds)', () => {
      expect(calculateImpliedProbability(150)).toBeCloseTo(40.0, 1)
      expect(calculateImpliedProbability(300)).toBeCloseTo(25.0, 1)
      expect(calculateImpliedProbability(700)).toBeCloseTo(12.5, 1)
    })

    it('should handle even odds', () => {
      expect(calculateImpliedProbability(100)).toBeCloseTo(50.0, 1)
    })
  })

  describe('calculateBasePoints', () => {
    it('should calculate correct base points for favorites', () => {
      expect(calculateBasePoints(-500)).toBeCloseTo(12.0, 1)
      expect(calculateBasePoints(-200)).toBeCloseTo(15.0, 1)
      expect(calculateBasePoints(-110)).toBeCloseTo(19.1, 1)
    })

    it('should calculate correct base points for underdogs', () => {
      expect(calculateBasePoints(150)).toBeCloseTo(25.0, 1)
      expect(calculateBasePoints(300)).toBeCloseTo(40.0, 1)
      expect(calculateBasePoints(700)).toBeCloseTo(80.0, 1)
    })

    it('should be inversely proportional to probability', () => {
      const heavyFavPoints = calculateBasePoints(-500) // ~83% prob
      const lightFavPoints = calculateBasePoints(-110) // ~52% prob
      const underdogPoints = calculateBasePoints(300) // ~25% prob

      // Lower probability should yield higher points
      expect(underdogPoints).toBeGreaterThan(lightFavPoints)
      expect(lightFavPoints).toBeGreaterThan(heavyFavPoints)
    })
  })

  describe('calculateIncorrectPoints', () => {
    it('should return negative points for incorrect predictions', () => {
      expect(calculateIncorrectPoints(-200)).toBeLessThan(0)
      expect(calculateIncorrectPoints(300)).toBeLessThan(0)
    })

    it('should calculate loss points using LOSS_MULTIPLIER = 0.5', () => {
      // -500 odds: 83.3% probability
      // Loss = -1 × 0.5 × (83.3 / 10) = -4.165
      expect(calculateIncorrectPoints(-500)).toBeCloseTo(-4.17, 1)

      // -200 odds: 66.7% probability
      // Loss = -1 × 0.5 × (66.7 / 10) = -3.335
      expect(calculateIncorrectPoints(-200)).toBeCloseTo(-3.33, 1)

      // -110 odds: 52.4% probability
      // Loss = -1 × 0.5 × (52.4 / 10) = -2.62
      expect(calculateIncorrectPoints(-110)).toBeCloseTo(-2.62, 1)

      // +150 odds: 40% probability
      // Loss = -1 × 0.5 × (40 / 10) = -2.0
      expect(calculateIncorrectPoints(150)).toBeCloseTo(-2.0, 1)

      // +300 odds: 25% probability
      // Loss = -1 × 0.5 × (25 / 10) = -1.25
      expect(calculateIncorrectPoints(300)).toBeCloseTo(-1.25, 1)

      // +700 odds: 12.5% probability
      // Loss = -1 × 0.5 × (12.5 / 10) = -0.625
      expect(calculateIncorrectPoints(700)).toBeCloseTo(-0.63, 1)
    })

    it('should penalize favorites more than underdogs', () => {
      const favoriteLoss = Math.abs(calculateIncorrectPoints(-300))
      const underdogLoss = Math.abs(calculateIncorrectPoints(300))

      // Missing a favorite should cost more than missing an underdog
      expect(favoriteLoss).toBeGreaterThan(underdogLoss)
    })

    it('should have minimal penalty for longshots', () => {
      const longshotLoss = Math.abs(calculateIncorrectPoints(700))

      // Longshots should have very low penalty (asymmetric risk/reward)
      expect(longshotLoss).toBeLessThan(1)
    })
  })

  describe('calculatePointsForOutcome', () => {
    it('should return positive points for correct predictions', () => {
      const correctPoints = calculatePointsForOutcome(-200, true)
      expect(correctPoints).toBeGreaterThan(0)
      expect(correctPoints).toBeCloseTo(15, 0)
    })

    it('should return negative points for incorrect predictions', () => {
      const incorrectPoints = calculatePointsForOutcome(-200, false)
      expect(incorrectPoints).toBeLessThan(0)
      expect(incorrectPoints).toBeCloseTo(-3.33, 1)
    })

    it('should handle both outcomes consistently', () => {
      const odds = 300

      const correctPts = calculatePointsForOutcome(odds, true)
      const incorrectPts = calculatePointsForOutcome(odds, false)

      expect(correctPts).toBeGreaterThan(0)
      expect(incorrectPts).toBeLessThan(0)

      // Verify the values match expected formulas
      expect(correctPts).toBeCloseTo(40, 0)
      expect(incorrectPts).toBeCloseTo(-1.25, 1)
    })
  })

  describe('Expected Value Analysis', () => {
    it('should maintain balanced expected value across different odds', () => {
      const testCases = [
        { odds: -500, winRate: 0.833 }, // Heavy favorite
        { odds: -200, winRate: 0.667 }, // Moderate favorite
        { odds: -110, winRate: 0.524 }, // Pick'em
        { odds: 300, winRate: 0.25 }, // Underdog
        { odds: 700, winRate: 0.125 }, // Longshot
      ]

      const expectedValues = testCases.map(({ odds, winRate }) => {
        const correctPoints = calculateBasePoints(odds)
        const incorrectPoints = calculateIncorrectPoints(odds)
        const ev = winRate * correctPoints + (1 - winRate) * incorrectPoints
        return { odds, ev }
      })

      // All EVs should be roughly equal (around 9-10 points)
      expectedValues.forEach(({ odds, ev }) => {
        expect(ev).toBeGreaterThan(8)
        expect(ev).toBeLessThan(11)
      })

      // Calculate variance to ensure fairness
      const avgEV = expectedValues.reduce((sum, { ev }) => sum + ev, 0) / expectedValues.length
      const variance = expectedValues.reduce((sum, { ev }) => sum + Math.pow(ev - avgEV, 2), 0) / expectedValues.length

      // Low variance indicates balanced system
      expect(variance).toBeLessThan(1) // All EVs within ~1 point of each other
    })

    it('should demonstrate risk/reward profiles', () => {
      // Heavy favorite: low upside, higher penalty
      const heavyFavCorrect = calculateBasePoints(-500)
      const heavyFavIncorrect = Math.abs(calculateIncorrectPoints(-500))
      const favRatio = heavyFavCorrect / heavyFavIncorrect

      // Longshot: high upside, minimal penalty
      const longshotCorrect = calculateBasePoints(700)
      const longshotIncorrect = Math.abs(calculateIncorrectPoints(700))
      const longshotRatio = longshotCorrect / longshotIncorrect

      // Longshots should have much more favorable risk/reward ratio
      expect(longshotRatio).toBeGreaterThan(favRatio * 10)
    })
  })

  describe('applyDiminishingReturns', () => {
    it('should apply full points for predictions 1-15', () => {
      expect(applyDiminishingReturns(20, 1)).toBe(20)
      expect(applyDiminishingReturns(20, 10)).toBe(20)
      expect(applyDiminishingReturns(20, 15)).toBe(20)
    })

    it('should apply 50% reduction for predictions 16-40', () => {
      expect(applyDiminishingReturns(20, 16)).toBe(10)
      expect(applyDiminishingReturns(20, 25)).toBe(10)
      expect(applyDiminishingReturns(20, 40)).toBe(10)
    })

    it('should apply hard cap (0 points) for predictions 41+', () => {
      expect(applyDiminishingReturns(20, 41)).toBe(0)
      expect(applyDiminishingReturns(20, 50)).toBe(0)
      expect(applyDiminishingReturns(20, 100)).toBe(0)
    })
  })

  describe('Integration Tests', () => {
    it('should handle complete flow for heavy favorite pick', () => {
      const odds = -500
      const impliedProb = calculateImpliedProbability(odds)
      const correctPoints = calculateBasePoints(odds)
      const incorrectPoints = calculateIncorrectPoints(odds)

      expect(impliedProb).toBeCloseTo(83.33, 1)
      expect(correctPoints).toBeCloseTo(12, 0)
      expect(incorrectPoints).toBeCloseTo(-4.17, 1)

      // Expected value should be positive
      const ev = (impliedProb / 100) * correctPoints + (1 - impliedProb / 100) * incorrectPoints
      expect(ev).toBeGreaterThan(0)
    })

    it('should handle complete flow for underdog pick', () => {
      const odds = 300
      const impliedProb = calculateImpliedProbability(odds)
      const correctPoints = calculateBasePoints(odds)
      const incorrectPoints = calculateIncorrectPoints(odds)

      expect(impliedProb).toBeCloseTo(25, 1)
      expect(correctPoints).toBeCloseTo(40, 0)
      expect(incorrectPoints).toBeCloseTo(-1.25, 1)

      // Expected value should be positive
      const ev = (impliedProb / 100) * correctPoints + (1 - impliedProb / 100) * incorrectPoints
      expect(ev).toBeGreaterThan(0)
    })

    it('should demonstrate that users cannot exploit the system', () => {
      // Test that no strategy has significantly higher EV
      const strategies = [
        { name: 'Only favorites', odds: [-500, -400, -300] },
        { name: 'Only underdogs', odds: [300, 400, 500] },
        { name: "Pick'ems", odds: [-110, -105, 100] },
        { name: 'Mixed', odds: [-200, 110, 300] },
      ]

      const strategyEVs = strategies.map(({ name, odds }) => {
        const avgEV =
          odds.reduce((sum, odd) => {
            const prob = calculateImpliedProbability(odd) / 100
            const correct = calculateBasePoints(odd)
            const incorrect = calculateIncorrectPoints(odd)
            return sum + prob * correct + (1 - prob) * incorrect
          }, 0) / odds.length

        return { name, avgEV }
      })

      // All strategies should have similar EV (within 20% of each other)
      const evValues = strategyEVs.map((s) => s.avgEV)
      const maxEV = Math.max(...evValues)
      const minEV = Math.min(...evValues)

      expect((maxEV - minEV) / minEV).toBeLessThan(0.2) // Less than 20% variance
    })
  })
})
