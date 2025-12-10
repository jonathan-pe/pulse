import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { formatOdds, formatDate, formatGameTime, formatWinRate, formatPoints } from '../formatting'

describe('Formatting Utilities', () => {
  describe('formatOdds', () => {
    it('should format negative odds correctly', () => {
      expect(formatOdds(-150)).toBe('-150')
      expect(formatOdds(-500)).toBe('-500')
      expect(formatOdds(-110)).toBe('-110')
    })

    it('should format positive odds with + sign', () => {
      expect(formatOdds(150)).toBe('+150')
      expect(formatOdds(300)).toBe('+300')
      expect(formatOdds(700)).toBe('+700')
    })

    it('should format even odds (+100) correctly', () => {
      expect(formatOdds(100)).toBe('+100')
    })

    it('should handle edge cases', () => {
      expect(formatOdds(0)).toBe('0') // 0 is neither positive nor negative
      expect(formatOdds(-0)).toBe('0')
      expect(formatOdds(1)).toBe('+1')
      expect(formatOdds(-1)).toBe('-1')
    })
  })

  describe('formatDate', () => {
    it('should format date from ISO string', () => {
      const formatted = formatDate('2025-12-09T19:00:00Z')
      expect(formatted).toBeTruthy()
      expect(typeof formatted).toBe('string')
    })

    it('should format date from Date object', () => {
      const date = new Date('2025-12-09T19:00:00Z')
      const formatted = formatDate(date)
      expect(formatted).toBeTruthy()
      expect(typeof formatted).toBe('string')
    })

    it('should respect custom format options', () => {
      const date = '2025-12-09T19:00:00Z'

      const timeOnly = formatDate(date, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
      expect(timeOnly).toMatch(/\d{1,2}:\d{2}\s*(AM|PM)/i)

      const dateOnly = formatDate(date, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
      expect(dateOnly).toContain('2025')
    })

    it('should handle various date formats', () => {
      const isoDate = formatDate('2025-12-09T19:00:00Z')
      const dateObj = formatDate(new Date('2025-12-09T19:00:00Z'))

      // Both should produce valid formatted dates
      expect(isoDate).toBeTruthy()
      expect(dateObj).toBeTruthy()
    })
  })

  describe('formatGameTime', () => {
    beforeEach(() => {
      // Mock current date to 2025-12-09 12:00 PM UTC
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2025-12-09T12:00:00Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should return "Live" for live games', () => {
      const time = formatGameTime('2025-12-09T19:00:00Z', 'live')
      expect(time).toBe('Live')
    })

    it('should return "Final" for completed games', () => {
      const time = formatGameTime('2025-12-09T10:00:00Z', 'final')
      expect(time).toBe('Final')
    })

    it('should show "Today at" for games within 24 hours', () => {
      // Game at 7:00 PM today (7 hours from now)
      const time = formatGameTime('2025-12-09T19:00:00Z', 'scheduled')
      expect(time).toContain('Today at')
    })

    it('should show "Tomorrow at" for games 24-48 hours away', () => {
      // Game tomorrow at 7:00 PM (31 hours from now)
      const time = formatGameTime('2025-12-10T19:00:00Z', 'scheduled')
      expect(time).toContain('Tomorrow at')
    })

    it('should show full date for games beyond 48 hours', () => {
      // Game in 3 days
      const time = formatGameTime('2025-12-12T19:00:00Z', 'scheduled')
      expect(time).not.toContain('Today')
      expect(time).not.toContain('Tomorrow')
      // Should contain day of week and date
      expect(time).toMatch(/\w{3}/) // Weekday abbreviation
    })

    it('should handle Date objects', () => {
      const date = new Date('2025-12-09T19:00:00Z')
      const time = formatGameTime(date, 'scheduled')
      expect(time).toContain('Today at')
    })

    it('should default to scheduled formatting when no status provided', () => {
      const time = formatGameTime('2025-12-09T19:00:00Z')
      expect(time).toBeTruthy()
      expect(time).not.toBe('Live')
      expect(time).not.toBe('Final')
    })
  })

  describe('formatWinRate', () => {
    it('should calculate win rate percentage correctly', () => {
      expect(formatWinRate(15, 20)).toBe('75.0%')
      expect(formatWinRate(10, 10)).toBe('100.0%')
      expect(formatWinRate(0, 10)).toBe('0.0%')
    })

    it('should respect custom decimal places', () => {
      expect(formatWinRate(2, 3, 0)).toBe('67%')
      expect(formatWinRate(2, 3, 1)).toBe('66.7%')
      expect(formatWinRate(2, 3, 2)).toBe('66.67%')
      expect(formatWinRate(2, 3, 3)).toBe('66.667%')
    })

    it('should handle zero total gracefully', () => {
      expect(formatWinRate(0, 0)).toBe('0.0%')
      expect(formatWinRate(5, 0)).toBe('0.0%') // Shouldn't happen, but safe
    })

    it('should round correctly', () => {
      expect(formatWinRate(1, 3, 1)).toBe('33.3%')
      expect(formatWinRate(2, 3, 1)).toBe('66.7%')
      expect(formatWinRate(7, 9, 1)).toBe('77.8%')
    })

    it('should handle perfect and zero win rates', () => {
      expect(formatWinRate(20, 20)).toBe('100.0%')
      expect(formatWinRate(0, 20)).toBe('0.0%')
    })

    it('should handle single prediction', () => {
      expect(formatWinRate(1, 1)).toBe('100.0%')
      expect(formatWinRate(0, 1)).toBe('0.0%')
    })
  })

  describe('formatPoints', () => {
    it('should format positive points with + sign', () => {
      expect(formatPoints(15.5)).toBe('+15.5')
      expect(formatPoints(100.0)).toBe('+100.0')
      expect(formatPoints(0.1)).toBe('+0.1')
    })

    it('should format negative points correctly', () => {
      expect(formatPoints(-3.2)).toBe('-3.2')
      expect(formatPoints(-10.7)).toBe('-10.7')
      expect(formatPoints(-0.5)).toBe('-0.5')
    })

    it('should format zero with + sign', () => {
      expect(formatPoints(0)).toBe('+0.0')
      expect(formatPoints(-0)).toBe('+0.0')
    })

    it('should respect custom decimal places', () => {
      expect(formatPoints(15.567, 0)).toBe('+16')
      expect(formatPoints(15.567, 1)).toBe('+15.6')
      expect(formatPoints(15.567, 2)).toBe('+15.57')
      expect(formatPoints(15.567, 3)).toBe('+15.567')
    })

    it('should handle very small values', () => {
      expect(formatPoints(0.01, 2)).toBe('+0.01')
      expect(formatPoints(-0.01, 2)).toBe('-0.01')
    })

    it('should handle large values', () => {
      expect(formatPoints(1234.5, 1)).toBe('+1234.5')
      expect(formatPoints(-9999.9, 1)).toBe('-9999.9')
    })

    it('should round correctly', () => {
      expect(formatPoints(15.46, 1)).toBe('+15.5')
      expect(formatPoints(15.44, 1)).toBe('+15.4')
      expect(formatPoints(-15.46, 1)).toBe('-15.5')
      expect(formatPoints(-15.44, 1)).toBe('-15.4')
    })
  })

  describe('Integration scenarios', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2025-12-09T12:00:00Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should format complete game display correctly', () => {
      const game = {
        league: 'NFL',
        startsAt: '2025-12-09T19:00:00Z',
        status: 'scheduled',
        homeOdds: -150,
        awayOdds: 130,
      }

      const gameTime = formatGameTime(game.startsAt, game.status)
      const homeOddsFormatted = formatOdds(game.homeOdds)
      const awayOddsFormatted = formatOdds(game.awayOdds)

      expect(gameTime).toContain('Today at')
      expect(homeOddsFormatted).toBe('-150')
      expect(awayOddsFormatted).toBe('+130')
    })

    it('should format user stats display correctly', () => {
      const userStats = {
        wins: 15,
        total: 20,
        points: 42.5,
      }

      const winRate = formatWinRate(userStats.wins, userStats.total)
      const pointsFormatted = formatPoints(userStats.points)

      expect(winRate).toBe('75.0%')
      expect(pointsFormatted).toBe('+42.5')
    })

    it('should handle prediction result display', () => {
      const prediction = {
        odds: 300,
        pointsEarned: 40,
        isCorrect: true,
      }

      const oddsFormatted = formatOdds(prediction.odds)
      const pointsFormatted = formatPoints(prediction.pointsEarned)

      expect(oddsFormatted).toBe('+300')
      expect(pointsFormatted).toBe('+40.0')
    })

    it('should handle negative prediction result', () => {
      const prediction = {
        odds: -200,
        pointsLost: -3.3,
        isCorrect: false,
      }

      const oddsFormatted = formatOdds(prediction.odds)
      const pointsFormatted = formatPoints(prediction.pointsLost, 1)

      expect(oddsFormatted).toBe('-200')
      expect(pointsFormatted).toBe('-3.3')
    })
  })

  describe('Edge cases and error handling', () => {
    it('should throw on invalid date', () => {
      // Invalid dates throw RangeError from Intl.DateTimeFormat
      expect(() => formatDate('invalid-date')).toThrow()
    })

    it('should handle extreme odds values', () => {
      expect(formatOdds(-10000)).toBe('-10000')
      expect(formatOdds(10000)).toBe('+10000')
    })

    it('should handle extreme point values', () => {
      expect(formatPoints(999999.9)).toBe('+999999.9')
      expect(formatPoints(-999999.9)).toBe('-999999.9')
    })

    it('should handle floating point precision issues', () => {
      // Common floating point issue: 0.1 + 0.2 = 0.30000000000000004
      const points = 0.1 + 0.2
      const formatted = formatPoints(points, 1)
      expect(formatted).toBe('+0.3') // Should round correctly
    })
  })
})
