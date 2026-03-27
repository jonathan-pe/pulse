import { natstatToUtcISOString } from '../../utils/natstat'
import { eventIdentityKey } from './client'

function readString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function parseInteger(value: unknown): number | undefined {
  if (value == null || value === '') return undefined
  const parsed = Number.parseInt(String(value), 10)
  return Number.isNaN(parsed) ? undefined : parsed
}

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
    spreadFavouriteId?: string // NatStat team ID that the spread applies to (for post-processing)
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
 *
 * @param raw - The raw forecast response from NatStat API
 * @param league - The league code (e.g., 'NFL', 'NBA')
 * @param teamCodeToName - Optional map of team codes to full team names from the database
 */
export function normalizeForecasts(raw: any, league?: string, teamCodeToName?: Map<string, string>): NormalizedEvent[] {
  // Extract forecasts map: { forecast_17118: {...}, forecast_17119: {...}, ... }
  const forecasts = raw?.forecasts
  if (!forecasts || typeof forecasts !== 'object') {
    return []
  }

  const items = Object.entries(forecasts)
  const normalizedLeague = league?.toUpperCase() === 'PFB' ? 'NFL' : league?.toUpperCase()

  return items.map(([forecastId, forecast]: [string, any]) => {
    // Parse team codes first
    const homeCode = readString(forecast['home-code'])
    const awayCode = readString(forecast['visitor-code'])

    // Use team codes to look up full team names from database if available
    // Otherwise fall back to the names provided in the forecast data
    const homeFromApi = readString(forecast.home) ?? homeCode
    const awayFromApi = readString(forecast.visitor) ?? awayCode

    const home = (homeCode && teamCodeToName?.get(homeCode)) ?? homeFromApi
    const away = (awayCode && teamCodeToName?.get(awayCode)) ?? awayFromApi
    const startsAtRaw = forecast.gamedate
    const startsAt = natstatToUtcISOString(startsAtRaw)

    // Extract status and scores
    const status = readString(forecast.gamestatus) ?? 'scheduled'
    const homeScore = parseInteger(forecast['score-home'])
    const awayScore = parseInteger(forecast['score-vis'])

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
    const book = readString(raw?.query?.uri) ?? readString(raw?.meta?.api) ?? 'natstat'
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
      // NatStat provides:
      // - spread: The spread value (e.g., +5.5 or -3.5)
      // - favourite: The team ID that this spread applies to
      // The adjustSpreadSigns function will convert it to be relative to home team
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
 * Helper to adjust spreads to be relative to the home team.
 *
 * NatStat provides:
 * - `spread`: The spread value (e.g., +5.5 or -3.5)
 * - `favourite`: The team ID that the spread applies to
 *
 * We need to convert this to always be relative to the home team:
 * - If the spread applies to the home team, use it as-is
 * - If the spread applies to the away team, negate it
 *
 * Example:
 * - Spread: +5.5, Favourite: Away Team → Home team gets -5.5 (home is underdog by 5.5)
 * - Spread: -3.5, Favourite: Home Team → Home team gets -3.5 (home favored by 3.5)
 * - Spread: +7, Favourite: Home Team → Home team gets +7 (home is underdog by 7)
 *
 * @param teamIdToCode - Map of NatStat team IDs to team codes
 */
export function adjustSpreadSigns(events: NormalizedEvent[], teamIdToCode: Map<string, string>): NormalizedEvent[] {
  return events.map((event) => {
    const adjustedLines = event.lines.map((line) => {
      if (line.market !== 'pointspread' || line.spread === undefined || !line.spreadFavouriteId) {
        return line
      }

      // Look up which team the spread applies to
      const spreadAppliesTo = teamIdToCode.get(line.spreadFavouriteId)
      if (!spreadAppliesTo) {
        // Can't determine which team, keep spread as-is
        return line
      }

      const spreadAppliesToHome = spreadAppliesTo === event.homeTeamCode
      const spreadAppliesToAway = spreadAppliesTo === event.awayTeamCode

      let adjustedSpread = line.spread
      const spreadMagnitude = Math.abs(line.spread)

      if (spreadAppliesToHome) {
        // Store spreads from the home team's perspective: negative means home favored.
        adjustedSpread = -spreadMagnitude
      } else if (spreadAppliesToAway) {
        // Store spreads from the home team's perspective: positive means away favored.
        adjustedSpread = spreadMagnitude
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
