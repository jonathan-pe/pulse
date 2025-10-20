import { natstatToUtcISOString } from '../../utils/natstat'
import { eventIdentityKey } from './client'

export type NormalizedEvent = {
  provider: 'natstat'
  externalEventId?: string
  identity: string
  league?: string
  startsAt?: string | null
  homeTeam?: string
  awayTeam?: string
  homeTeamCode?: string // Team code for home team
  awayTeamCode?: string // Team code for away team
  status?: string
  homeScore?: number
  awayScore?: number
  lines: Array<{
    market: 'moneyline' | 'pointspread' | 'overunder'
    book: string
    moneylineHome?: number
    moneylineAway?: number
    spread?: number
    spreadFavouriteId?: string // NatStat team ID of the favorite (for post-processing)
    spreadHomePrice?: number
    spreadAwayPrice?: number
    total?: number
    overPrice?: number
    underPrice?: number
    updatedAt?: string | null
  }>
}

/**
 * Normalize the unified /forecasts endpoint response.
 * This endpoint provides all markets (moneyline, spread, over/under) in one response.
 */
export function normalizeForecasts(raw: any, league?: string): NormalizedEvent[] {
  // Extract forecasts map: { forecast_17118: {...}, forecast_17119: {...}, ... }
  const forecasts = raw?.forecasts
  if (!forecasts || typeof forecasts !== 'object') {
    return []
  }

  const items = Object.entries(forecasts)
  const normalizedLeague = league?.toUpperCase() === 'PFB' ? 'NFL' : league?.toUpperCase()

  return items.map(([forecastId, forecast]: [string, any]) => {
    // Parse basic game info
    const home = forecast.home ?? forecast['home-code']
    const away = forecast.visitor ?? forecast['visitor-code']
    const homeCode = forecast['home-code']
    const awayCode = forecast['visitor-code']
    const startsAtRaw = forecast.gamedate
    const startsAt = natstatToUtcISOString(startsAtRaw)

    // Extract status and scores
    const status = typeof forecast.gamestatus === 'string' ? forecast.gamestatus : 'scheduled'
    const homeScore = forecast['score-home'] ? parseInt(forecast['score-home'], 10) : undefined
    const awayScore = forecast['score-vis'] ? parseInt(forecast['score-vis'], 10) : undefined

    // Generate identity key
    const identity = eventIdentityKey({
      startsAt,
      home,
      away,
      league: normalizedLeague,
    })

    // External event ID from the forecast key (e.g., "forecast_17118" -> "17118")
    const externalEventId = forecastId.replace('forecast_', '')

    // Use the API metadata for the book/source
    const book = raw?.query?.uri ?? raw?.meta?.api ?? 'natstat'
    const processedAt = raw?.meta?.['processed-at']
    const updatedAt = natstatToUtcISOString(processedAt)

    const lines: NormalizedEvent['lines'] = []

    // Parse forecast data
    const forecastData = forecast.forecast
    if (forecastData) {
      // Parse moneyline
      const moneylineData = forecastData.moneyline
      if (moneylineData) {
        const parseOdd = (v: any) => {
          if (v == null) return undefined
          const str = String(v).replace(/[^0-9\-+]/g, '')
          const n = parseInt(str, 10)
          return Number.isNaN(n) ? undefined : n
        }

        const moneylineHome = parseOdd(moneylineData.homemoneyline)
        const moneylineAway = parseOdd(moneylineData.vismoneyline)

        if (moneylineHome !== undefined || moneylineAway !== undefined) {
          lines.push({
            market: 'moneyline',
            book: String(book),
            moneylineHome,
            moneylineAway,
            updatedAt,
          })
        }
      }

      // Parse spread (point spread)
      // IMPORTANT: We always store the spread relative to the home team.
      // NatStat provides the spread and a `favourite` team ID in the spread object.
      // We need to determine if the home or away team is favored, then adjust the sign.
      // - If home team is favored: spread should be negative (e.g., -3.5)
      // - If away team is favored: spread should be positive (e.g., +3.5)
      const spreadData = forecastData.spread
      if (spreadData) {
        const parseNumber = (v: any) => {
          if (v == null || v === '') return undefined
          const n = Number(String(v).replace(/[^0-9.-]/g, ''))
          return Number.isFinite(n) ? n : undefined
        }

        let spread = parseNumber(spreadData.spread)

        if (spread !== undefined) {
          // Store the raw favourite ID for later processing
          // The job will look up team codes and adjust spread sign accordingly
          const favouriteId = spreadData.favourite

          lines.push({
            market: 'pointspread',
            book: String(book),
            spread,
            spreadFavouriteId: favouriteId, // Store for later processing
            updatedAt,
          })
        }
      }

      // Parse over/under (total)
      const ouData = forecastData.overunder
      if (ouData) {
        const parseNumber = (v: any) => {
          if (v == null || v === '') return undefined
          const n = Number(String(v).replace(/[^0-9.-]/g, ''))
          return Number.isFinite(n) ? n : undefined
        }

        const total = parseNumber(ouData.overunder)

        if (total !== undefined) {
          lines.push({
            market: 'overunder',
            book: String(book),
            total,
            // NatStat forecasts don't typically include over/under prices
            updatedAt,
          })
        }
      }
    }

    return {
      provider: 'natstat' as const,
      externalEventId,
      identity,
      league: normalizedLeague,
      startsAt: startsAt ?? undefined,
      homeTeam: home,
      awayTeam: away,
      homeTeamCode: homeCode,
      awayTeamCode: awayCode,
      status,
      homeScore,
      awayScore,
      lines,
    }
  })
}

/**
 * Helper to adjust spread signs based on which team is favored.
 * Spreads should always be stored relative to the home team:
 * - Negative spread = home team is favored
 * - Positive spread = away team is favored (home is underdog)
 *
 * @param teamIdToCode - Map of NatStat team IDs to team codes
 */
export function adjustSpreadSigns(events: NormalizedEvent[], teamIdToCode: Map<string, string>): NormalizedEvent[] {
  return events.map((event) => {
    const adjustedLines = event.lines.map((line) => {
      if (line.market !== 'pointspread' || line.spread === undefined || !line.spreadFavouriteId) {
        return line
      }

      // Look up the favorite team's code
      const favouriteCode = teamIdToCode.get(line.spreadFavouriteId)
      if (!favouriteCode) {
        // Can't determine favorite, keep spread as-is
        return line
      }

      const homeIsFavorite = favouriteCode === event.homeTeamCode
      const awayIsFavorite = favouriteCode === event.awayTeamCode

      let adjustedSpread = line.spread

      if (homeIsFavorite) {
        // Home team is favored, spread should be negative
        adjustedSpread = -Math.abs(line.spread)
      } else if (awayIsFavorite) {
        // Away team is favored, spread should be positive (home is underdog)
        adjustedSpread = Math.abs(line.spread)
      }

      // Remove the favouriteId from the final line
      const { spreadFavouriteId, ...rest } = line
      return {
        ...rest,
        spread: adjustedSpread,
      }
    })

    return {
      ...event,
      lines: adjustedLines,
    }
  })
}
