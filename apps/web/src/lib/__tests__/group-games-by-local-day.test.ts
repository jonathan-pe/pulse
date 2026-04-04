import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { groupGamesByLocalDay } from '@/lib/group-games-by-local-day'
import type { GameWithUnifiedOdds } from '@pulse/types'

function minimalGame(overrides: Partial<GameWithUnifiedOdds> & { id: string; startsAt: string }): GameWithUnifiedOdds {
  return {
    id: overrides.id,
    league: 'NBA',
    homeTeam: { name: 'Home', code: 'HOM', logoUrl: null },
    awayTeam: { name: 'Away', code: 'AWY', logoUrl: null },
    startsAt: overrides.startsAt,
    status: 'scheduled',
    odds: {},
    ...overrides,
  } as GameWithUnifiedOdds
}

describe('groupGamesByLocalDay', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-04T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns empty array for no games', () => {
    expect(groupGamesByLocalDay([])).toEqual([])
  })

  it('labels Today and Tomorrow (TZ=UTC)', () => {
    const games = [
      minimalGame({ id: '1', startsAt: '2026-04-04T18:00:00.000Z' }),
      minimalGame({ id: '2', startsAt: '2026-04-05T18:00:00.000Z' }),
    ]
    const groups = groupGamesByLocalDay(games)
    expect(groups).toHaveLength(2)
    expect(groups[0].label).toBe('Today')
    expect(groups[1].label).toBe('Tomorrow')
  })

  it('orders calendar days soonest first', () => {
    const games = [
      minimalGame({ id: 'apr10', startsAt: '2026-04-10T12:00:00.000Z' }),
      minimalGame({ id: 'apr6', startsAt: '2026-04-06T12:00:00.000Z' }),
      minimalGame({ id: 'apr5', startsAt: '2026-04-05T12:00:00.000Z' }),
    ]
    const groups = groupGamesByLocalDay(games)
    expect(groups.map((g) => g.dateKey)).toEqual(['2026-04-05', '2026-04-06', '2026-04-10'])
    expect(groups.map((g) => g.games.map((x) => x.id))).toEqual([['apr5'], ['apr6'], ['apr10']])
  })

  it('sorts games within the same local calendar day by startsAt', () => {
    const early = new Date(2026, 3, 10, 8, 0, 0, 0).toISOString()
    const late = new Date(2026, 3, 10, 20, 0, 0, 0).toISOString()
    const games = [minimalGame({ id: 'late', startsAt: late }), minimalGame({ id: 'early', startsAt: early })]
    const groups = groupGamesByLocalDay(games)
    expect(groups).toHaveLength(1)
    expect(groups[0].games.map((g) => g.id)).toEqual(['early', 'late'])
  })
})
