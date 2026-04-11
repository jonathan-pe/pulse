import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  calculateImpliedProbability,
  calculateBasePoints,
  calculateIncorrectPoints,
  calculatePointsForOutcome,
  DEFAULT_LOSS_MULTIPLIER as LOSS_MULTIPLIER,
} from '@pulse/shared'

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

    it('should calculate loss points using DEFAULT_LOSS_MULTIPLIER (1)', () => {
      expect(calculateIncorrectPoints(-500)).toBeCloseTo(-8.33, 1)
      expect(calculateIncorrectPoints(-200)).toBeCloseTo(-6.67, 1)
      expect(calculateIncorrectPoints(-110)).toBeCloseTo(-5.24, 1)
      expect(calculateIncorrectPoints(150)).toBeCloseTo(-4.0, 1)
      expect(calculateIncorrectPoints(300)).toBeCloseTo(-2.5, 1)
      expect(calculateIncorrectPoints(700)).toBeCloseTo(-1.25, 1)
    })

    it('should penalize favorites more than underdogs', () => {
      const favoriteLoss = Math.abs(calculateIncorrectPoints(-300))
      const underdogLoss = Math.abs(calculateIncorrectPoints(300))

      // Missing a favorite should cost more than missing an underdog
      expect(favoriteLoss).toBeGreaterThan(underdogLoss)
    })

    it('should have lower penalty for longshots than for heavy favorites', () => {
      const longshotLoss = Math.abs(calculateIncorrectPoints(700))
      const heavyFavoriteLoss = Math.abs(calculateIncorrectPoints(-500))

      expect(longshotLoss).toBeLessThan(heavyFavoriteLoss)
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
      expect(incorrectPoints).toBeCloseTo(-6.67, 1)
    })

    it('should handle both outcomes consistently', () => {
      const odds = 300

      const correctPts = calculatePointsForOutcome(odds, true)
      const incorrectPts = calculatePointsForOutcome(odds, false)

      expect(correctPts).toBeGreaterThan(0)
      expect(incorrectPts).toBeLessThan(0)

      // Verify the values match expected formulas
      expect(correctPts).toBeCloseTo(40, 0)
      expect(incorrectPts).toBeCloseTo(-2.5, 1)
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

      expectedValues.forEach(({ odds: _odds, ev }) => {
        expect(ev).toBeGreaterThan(7)
        expect(ev).toBeLessThan(11)
      })

      const avgEV = expectedValues.reduce((sum, { ev }) => sum + ev, 0) / expectedValues.length
      const variance = expectedValues.reduce((sum, { ev }) => sum + Math.pow(ev - avgEV, 2), 0) / expectedValues.length

      expect(variance).toBeLessThan(2)
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

  describe('Integration Tests', () => {
    it('should handle complete flow for heavy favorite pick', () => {
      const odds = -500
      const impliedProb = calculateImpliedProbability(odds)
      const correctPoints = calculateBasePoints(odds)
      const incorrectPoints = calculateIncorrectPoints(odds)

      expect(impliedProb).toBeCloseTo(83.33, 1)
      expect(correctPoints).toBeCloseTo(12, 0)
      expect(incorrectPoints).toBeCloseTo(-8.33, 1)

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
      expect(incorrectPoints).toBeCloseTo(-2.5, 1)

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
