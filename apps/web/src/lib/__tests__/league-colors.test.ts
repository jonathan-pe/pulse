import { describe, it, expect } from 'vitest'
import { getLeagueBadgeColor } from '../league-colors'

describe('League Badge Colors', () => {
  it('should return correct color classes for NFL', () => {
    const color = getLeagueBadgeColor('NFL')
    expect(color).toContain('bg-red-100')
    expect(color).toContain('text-red-800')
    expect(color).toContain('dark:bg-red-900/30')
  })

  it('should return correct color classes for NBA', () => {
    const color = getLeagueBadgeColor('NBA')
    expect(color).toContain('bg-orange-100')
    expect(color).toContain('text-orange-800')
  })

  it('should return correct color classes for MLB', () => {
    const color = getLeagueBadgeColor('MLB')
    expect(color).toContain('bg-blue-100')
    expect(color).toContain('text-blue-800')
  })

  it('should return correct color classes for NHL', () => {
    const color = getLeagueBadgeColor('NHL')
    expect(color).toContain('bg-cyan-100')
    expect(color).toContain('text-cyan-800')
  })

  it('should handle case-insensitive input', () => {
    expect(getLeagueBadgeColor('nfl')).toBe(getLeagueBadgeColor('NFL'))
    expect(getLeagueBadgeColor('Nba')).toBe(getLeagueBadgeColor('NBA'))
    expect(getLeagueBadgeColor('mlb')).toBe(getLeagueBadgeColor('MLB'))
  })

  it('should return default gray color for unknown leagues', () => {
    const color = getLeagueBadgeColor('UNKNOWN')
    expect(color).toContain('bg-gray-100')
    expect(color).toContain('text-gray-800')
  })

  it('should return default color for empty string', () => {
    const color = getLeagueBadgeColor('')
    expect(color).toContain('bg-gray-100')
  })
})
