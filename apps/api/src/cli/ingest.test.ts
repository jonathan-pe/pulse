import { describe, expect, it } from 'vitest'
import { buildDefaultDateRange, parseIngestArgs, parseLeagueArg } from './ingest.js'

describe('buildDefaultDateRange', () => {
  it('builds a 3-day lookback and lookahead range', () => {
    const range = buildDefaultDateRange(new Date('2026-03-22T15:30:00.000Z'))

    expect(range).toBe('2026-03-19,2026-03-25')
  })
})

describe('parseIngestArgs', () => {
  it('returns an empty result when no league is provided', () => {
    expect(parseIngestArgs([])).toEqual({})
  })

  it('uses league first and defaults the date range when omitted', () => {
    const realDate = globalThis.Date

    class MockDate extends Date {
      constructor(value?: string | number | Date) {
        super(value ?? '2026-03-22T12:00:00.000Z')
      }

      static override now() {
        return new realDate('2026-03-22T12:00:00.000Z').getTime()
      }
    }

    globalThis.Date = MockDate as DateConstructor

    try {
      expect(parseIngestArgs(['nba'])).toEqual({
        leagues: ['NBA'],
        date: '2026-03-19,2026-03-25',
      })
    } finally {
      globalThis.Date = realDate
    }
  })

  it('accepts a single explicit date after the league', () => {
    expect(parseIngestArgs(['NFL', '2025-10-19'])).toEqual({
      leagues: ['NFL'],
      date: '2025-10-19',
    })
  })

  it('accepts an explicit date range after the league', () => {
    expect(parseIngestArgs(['MLB', '2025-10-19,2025-10-26'])).toEqual({
      leagues: ['MLB'],
      date: '2025-10-19,2025-10-26',
    })
  })

  it('accepts a comma-delimited list of leagues', () => {
    expect(parseIngestArgs(['NFL,NBA', '2025-10-19'])).toEqual({
      leagues: ['NFL', 'NBA'],
      date: '2025-10-19',
    })
  })

  it('trims spaces around comma-separated leagues', () => {
    expect(parseLeagueArg(' nfl , NBA ')).toEqual(['NFL', 'NBA'])
  })
})
