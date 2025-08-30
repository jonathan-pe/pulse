import { natstatToUtcISOString } from '../../utils/natstat'
import { eventIdentityKey } from './client'

export type NormalizedEvent = {
  provider: 'natstat'
  externalEventId?: string
  identity: string
  league?: string
  startsAt?: string
  homeTeam?: string
  awayTeam?: string
  lines: Array<{
    market: 'moneyline' | 'pointspread' | 'overunder'
    book: string
    moneylineHome?: number
    moneylineAway?: number
    spread?: number
    spreadHomePrice?: number
    spreadAwayPrice?: number
    total?: number
    overPrice?: number
    underPrice?: number
    updatedAt?: string
  }>
}

export function normalizeMarket(raw: any, market: string): NormalizedEvent[] {
  // Helper to extract a map of game objects from either raw.<plural> or raw itself
  const extractMap = (pluralKey: string) => {
    if (raw?.[pluralKey] && typeof raw[pluralKey] === 'object') return raw[pluralKey]
    // if raw looks like a map of games (keys like game_123)
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      const keys = Object.keys(raw)
      if (keys.length > 0) {
        const first = raw[keys[0]]
        if (first && typeof first === 'object' && ('game-code' in first || 'visitor' in first || 'home' in first)) {
          return raw
        }
      }
    }
    return null
  }

  // NatStat moneyline payload shape: { moneylines: { moneyline_123: { ... } }, ... }
  if (market === 'moneyline') {
    const map = extractMap('moneylines')
    if (map) {
      const items = Object.values(map)
      return items.map((it: any) => {
        const startsAtRaw = it['gamedate'] ?? it.gamedate ?? undefined
        const startsAt = natstatToUtcISOString(startsAtRaw)
        const home = it.home ?? it['home'] ?? it['home-team'] ?? undefined
        const away = it.visitor ?? it['visitor'] ?? it['away'] ?? undefined
        // prefer provider 'game-code' when available
        const externalEventId = it['game-code'] ?? it['game_code'] ?? it.id ?? undefined

        const identity = eventIdentityKey({ startsAt, home, away, league: raw?.query?.scope ?? it.league })

        const book = raw?.query?.uri ?? raw?.query?.endpoint ?? raw?.source ?? 'natstat'

        const parseOdd = (v: any) => {
          if (v == null) return undefined
          const n = parseInt(String(v).replace(/[^0-9\-+]/g, ''), 10)
          return Number.isNaN(n) ? undefined : n
        }

        const moneylineHome = parseOdd(it.homemoneyline ?? it.homeMoneyline ?? it.home_price)
        const moneylineAway = parseOdd(it.vismoneyline ?? it.visMoneyline ?? it.away_price)

        const processedAtRaw = raw?.meta?.['processed-at'] ?? it.updatedAt ?? undefined
        const updatedAt = natstatToUtcISOString(processedAtRaw)

        return {
          provider: 'natstat' as const,
          externalEventId: externalEventId ? String(externalEventId) : undefined,
          identity,
          league: raw?.query?.scope ?? it.league ?? undefined,
          startsAt,
          homeTeam: home,
          awayTeam: away,
          lines: [
            {
              market: 'moneyline',
              book: String(book ?? 'natstat'),
              moneylineHome,
              moneylineAway,
              updatedAt,
            },
          ],
        }
      })
    }
  }

  // NatStat point spread payload: { spreads: { spread_123: { ... } } }
  if (market === 'pointspread') {
    const map = extractMap('spreads')
    if (map) {
      const items = Object.values(map)
      return items.map((it: any) => {
        const startsAtRaw = it['gamedate'] ?? it.gamedate ?? undefined
        const startsAt = natstatToUtcISOString(startsAtRaw)
        const home = it.home ?? it['home'] ?? undefined
        const away = it.visitor ?? it['visitor'] ?? undefined
        const externalEventId = it['game-code'] ?? it['game_code'] ?? it.id ?? undefined

        const identity = eventIdentityKey({ startsAt, home, away, league: raw?.query?.scope ?? it.league })
        const book = raw?.query?.uri ?? raw?.query?.endpoint ?? raw?.source ?? 'natstat'

        const parseNumber = (v: any) => {
          if (v == null || v === '') return undefined
          const n = Number(String(v).replace(/[^0-9.-]/g, ''))
          return Number.isFinite(n) ? n : undefined
        }

        const spread = parseNumber(it.spread ?? it.pointspread ?? it.pointSpread)

        const processedAtRaw = raw?.meta?.['processed-at'] ?? it.updatedAt ?? undefined
        const updatedAt = natstatToUtcISOString(processedAtRaw)

        return {
          provider: 'natstat' as const,
          externalEventId: externalEventId ? String(externalEventId) : undefined,
          identity,
          league: raw?.query?.scope ?? it.league ?? undefined,
          startsAt,
          homeTeam: home,
          awayTeam: away,
          lines: [
            {
              market: 'pointspread',
              book: String(book ?? 'natstat'),
              spread,
              // NatStat pointspread responses often don't include prices in this endpoint
              updatedAt,
            },
          ],
        }
      })
    }
  }

  // NatStat over/under payload: { overunders: { game_123: { ... } } }
  if (market === 'overunder' || market === 'total') {
    const map = extractMap('overunders')
    if (map) {
      const items = Object.values(map)
      return items.map((it: any) => {
        const startsAtRaw = it['gamedate'] ?? it.gamedate ?? undefined
        const startsAt = natstatToUtcISOString(startsAtRaw)
        const home = it.home ?? it['home'] ?? undefined
        const away = it.visitor ?? it['visitor'] ?? undefined
        const externalEventId = it['game-code'] ?? it['game_code'] ?? it.id ?? undefined

        const identity = eventIdentityKey({ startsAt, home, away, league: raw?.query?.scope ?? it.league })
        const book = raw?.query?.uri ?? raw?.query?.endpoint ?? raw?.source ?? 'natstat'

        const parseNumber = (v: any) => {
          if (v == null || v === '') return undefined
          const n = Number(String(v).replace(/[^0-9.-]/g, ''))
          return Number.isFinite(n) ? n : undefined
        }

        const total = parseNumber(it.overunder ?? it.total ?? it.line)

        const processedAtRaw = raw?.meta?.['processed-at'] ?? it.updatedAt ?? undefined
        const updatedAt = natstatToUtcISOString(processedAtRaw)

        return {
          provider: 'natstat' as const,
          externalEventId: externalEventId ? String(externalEventId) : undefined,
          identity,
          league: raw?.query?.scope ?? it.league ?? undefined,
          startsAt,
          homeTeam: home,
          awayTeam: away,
          lines: [
            {
              market: 'overunder',
              book: String(book ?? 'natstat'),
              total,
              // prices for O/U may be absent in this endpoint
              updatedAt,
            },
          ],
        }
      })
    }
  }

  // Fallback: best-effort mapping; provider payloads vary. Expect `events` or root array.
  const items = Array.isArray(raw) ? raw : raw?.events ?? raw?.data ?? []

  return items.map((it: any) => {
    const identity = eventIdentityKey(it)
    const base = {
      provider: 'natstat' as const,
      externalEventId: it.eventId ?? it.id ?? undefined,
      identity,
      league: it.league ?? it.sport ?? undefined,
      startsAt: natstatToUtcISOString(it.startsAt ?? it.date ?? undefined),
      homeTeam: it.home ?? it.homeTeam ?? undefined,
      awayTeam: it.away ?? it.awayTeam ?? undefined,
      lines: [] as NormalizedEvent['lines'],
    }

    const book = it.book ?? it.source ?? it.provider ?? 'natstat'

    if (market === 'moneyline') {
      base.lines.push({
        market: 'moneyline',
        book: book,
        moneylineHome: it.moneylineHome ?? it.homePrice ?? undefined,
        moneylineAway: it.moneylineAway ?? it.awayPrice ?? undefined,
        updatedAt: natstatToUtcISOString(it.updatedAt ?? it.timestamp ?? undefined),
      })
    }

    if (market === 'pointspread') {
      base.lines.push({
        market: 'pointspread',
        book: book,
        spread: it.spread ?? it.pointSpread ?? undefined,
        spreadHomePrice: it.spreadHomePrice ?? it.homePrice ?? undefined,
        spreadAwayPrice: it.spreadAwayPrice ?? it.awayPrice ?? undefined,
        updatedAt: natstatToUtcISOString(it.updatedAt ?? it.timestamp ?? undefined),
      })
    }

    if (market === 'overunder' || market === 'total') {
      base.lines.push({
        market: 'overunder',
        book: book,
        total: it.total ?? it.line ?? undefined,
        overPrice: it.overPrice ?? it.over ?? undefined,
        underPrice: it.underPrice ?? it.under ?? undefined,
        updatedAt: natstatToUtcISOString(it.updatedAt ?? it.timestamp ?? undefined),
      })
    }

    return base
  })
}
