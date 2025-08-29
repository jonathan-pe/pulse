import { describe, it, expect } from 'vitest'
import { normalizeMarket } from '../normalize'

// Sample pointspread (trimmed) from user
const pointspreadSample: any = {
  spreads: {
    spread_5474255: {
      'game-code': '5474255',
      visitor: 'Arizona Diamondbacks',
      'visitor-code': 'ARI',
      home: 'Milwaukee Brewers',
      'home-code': 'MIL',
      overtime: 'N',
      gamedate: '2025-08-28 14:10:00',
      gameday: '2025-08-28',
      gameno: '1',
      venue: 'American Family Field',
      'venue-code': '130',
      url: 'https://natstat.com/mlb/game/H20250828arimil-1',
      spread: '-1.5',
    },
  },
  success: '1',
  query: { uri: 'https://api3.natst.at/pointspread/mlb/', endpoint: 'pointspread', scope: 'MLB' },
}

// Sample overunder (trimmed) from user
const overunderSample: any = {
  overunders: {
    game_5474255: {
      'game-code': '5474255',
      visitor: 'Arizona Diamondbacks',
      'visitor-code': 'ARI',
      'score-vis': '0',
      home: 'Milwaukee Brewers',
      'home-code': 'MIL',
      'score-home': '0',
      gamestatus: {},
      gamedate: '2025-08-28 14:10:00',
      gameday: '2025-08-28',
      'game-number': '1',
      venuename: 'American Family Field',
      url: 'https://natstat.com/mlb/game/H20250828arimil-1',
      overunder: '8.5',
      overunderresult: {},
    },
  },
  success: '1',
  query: { uri: 'https://api3.natst.at/overunder/mlb/', endpoint: 'overunder', scope: 'MLB' },
}

describe('natstat normalizeMarket', () => {
  it('parses pointspread sample into normalized event with numeric spread', () => {
    const normalized = normalizeMarket(pointspreadSample, 'pointspread')
    expect(Array.isArray(normalized)).toBe(true)
    expect(normalized.length).toBe(1)
    const ev = normalized[0]
    expect(ev.provider).toBe('natstat')
    // normalizer builds a deterministic identity (often hashed); assert it's present
    expect(typeof ev.identity).toBe('string')
    expect(ev.identity.length).toBeGreaterThan(0)
    // externalEventId should reflect provider game-code when present
    expect(ev.externalEventId).toBe('5474255')
    expect(ev.lines.length).toBe(1)
    const line = ev.lines[0]
    expect(line.market).toBe('pointspread')
    expect(typeof line.spread).toBe('number')
    expect(line.spread).toBe(-1.5)
    expect(line.book).toBe(String(pointspreadSample.query.uri))
  })

  it('parses moneyline sample into normalized event with numeric moneylines', () => {
    const moneylineSample: any = {
      moneylines: {
        moneyline_1001: {
          'game-code': '1001',
          visitor: 'Away Team',
          home: 'Home Team',
          gamedate: '2025-08-28 20:00:00',
          homemoneyline: '+120',
          vismoneyline: '-140',
        },
      },
      query: { uri: 'https://api3.natst.at/moneyline/mlb/', endpoint: 'moneyline', scope: 'MLB' },
    }

    const normalized = normalizeMarket(moneylineSample, 'moneyline')
    expect(Array.isArray(normalized)).toBe(true)
    expect(normalized.length).toBe(1)
    const ev = normalized[0]
    expect(ev.provider).toBe('natstat')
    expect(typeof ev.identity).toBe('string')
    expect(ev.externalEventId).toBe('1001')
    expect(ev.lines.length).toBe(1)
    const line = ev.lines[0]
    expect(line.market).toBe('moneyline')
    expect(line.moneylineHome).toBe(120)
    expect(line.moneylineAway).toBe(-140)
    expect(line.book).toBe(String(moneylineSample.query.uri))
  })

  describe('edge cases', () => {
    it('returns empty array when payload missing expected keys', () => {
      const res = normalizeMarket({}, 'moneyline')
      expect(Array.isArray(res)).toBe(true)
      expect(res.length).toBe(0)
    })

    it('handles malformed moneyline odds gracefully', () => {
      const badOdds: any = {
        moneylines: {
          moneyline_2002: {
            'game-code': '2002',
            visitor: 'Away',
            home: 'Home',
            gamedate: '2025-08-28 21:00:00',
            homemoneyline: 'PK',
            vismoneyline: '+150',
          },
        },
        query: { uri: 'https://api3.natst.at/moneyline/mlb/' },
      }
      const normalized = normalizeMarket(badOdds, 'moneyline')
      expect(normalized.length).toBe(1)
      const l = normalized[0].lines[0]
      expect(l.moneylineHome).toBeUndefined()
      expect(l.moneylineAway).toBe(150)
    })

    it('parses noisy overunder total strings', () => {
      const noisy: any = {
        overunders: {
          game_3003: {
            'game-code': '3003',
            visitor: 'A',
            home: 'B',
            gamedate: '2025-08-28 22:00:00',
            overunder: '8.5 (updated)',
          },
        },
        query: { uri: 'https://api3.natst.at/overunder/mlb/' },
      }
      const normalized = normalizeMarket(noisy, 'overunder')
      expect(normalized.length).toBe(1)
      const l = normalized[0].lines[0]
      expect(l.total).toBe(8.5)
    })
  })

  it('parses overunder sample into normalized event with numeric total', () => {
    const normalized = normalizeMarket(overunderSample, 'overunder')
    expect(Array.isArray(normalized)).toBe(true)
    expect(normalized.length).toBe(1)
    const ev = normalized[0]
    expect(ev.provider).toBe('natstat')
    // normalizer builds a deterministic identity (often hashed); assert it's present
    expect(typeof ev.identity).toBe('string')
    expect(ev.identity.length).toBeGreaterThan(0)
    // externalEventId should reflect provider game-code when present
    expect(ev.externalEventId).toBe('5474255')
    expect(ev.lines.length).toBe(1)
    const line = ev.lines[0]
    expect(line.market).toBe('overunder')
    expect(typeof line.total).toBe('number')
    expect(line.total).toBe(8.5)
    expect(line.book).toBe(String(overunderSample.query.uri))
  })
})
