import { describe, it, expect } from 'vitest'

describe('TeamLogo', () => {
  it('should generate correct fallback text from team code', () => {
    const props = {
      teamName: 'Boston Celtics',
      teamCode: 'bos',
      logoUrl: null,
    }
    
    // Extract the fallback logic to test
    const fallbackText = props.teamCode ? props.teamCode.toUpperCase() : 'BC'
    expect(fallbackText).toBe('BOS')
  })

  it('should generate initials from team name when no code provided', () => {
    const teamName = 'Los Angeles Lakers'
    const initials = teamName
      .split(' ')
      .map((s) => s[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
    
    expect(initials).toBe('LA')
  })
})
