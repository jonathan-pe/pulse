import { createLogger } from '../../lib/logger.js'
import type { ESPNTeamsResponse } from './types.js'

const logger = createLogger('ESPNClient')

const ESPN_BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports'
const ESPN_TIMEOUT_MS = 10000

/**
 * Map our league codes to ESPN sport/league paths
 */
const LEAGUE_MAP: Record<string, { sport: string; league: string }> = {
  NFL: { sport: 'football', league: 'nfl' },
  NBA: { sport: 'basketball', league: 'nba' },
  MLB: { sport: 'baseball', league: 'mlb' },
  NHL: { sport: 'hockey', league: 'nhl' },
}

/**
 * Fetch with timeout and basic retry logic
 */
async function fetchWithRetry(url: string, retries = 1): Promise<unknown> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), ESPN_TIMEOUT_MS)

  const startTime = Date.now()

  try {
    logger.debug('Making ESPN API request', { url, timeout: ESPN_TIMEOUT_MS })

    const res = await fetch(url, { signal: controller.signal })
    const duration = Date.now() - startTime

    if (res.status === 429) {
      logger.warn('ESPN rate limit hit', { url, statusCode: 429, duration })
      throw new Error(`espn: rate limited (429)`)
    }

    if (res.status >= 500 && retries > 0) {
      const wait = 200 + Math.floor(Math.random() * 600)
      logger.warn('ESPN server error, retrying', { url, statusCode: res.status, retryAfter: wait, duration })
      await new Promise((r) => setTimeout(r, wait))
      return fetchWithRetry(url, retries - 1)
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      logger.error('ESPN API error', undefined, { url, statusCode: res.status, duration, response: text })
      throw new Error(`espn: ${res.status} ${text}`)
    }

    logger.debug('ESPN API request successful', { url, statusCode: res.status, duration })

    return res.json()
  } catch (error) {
    const duration = Date.now() - startTime
    if (error instanceof Error && error.name === 'AbortError') {
      logger.error('ESPN API request timeout', error, { url, timeout: ESPN_TIMEOUT_MS, duration })
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Fetch all teams for a league from ESPN
 * @param league - League code (e.g., 'NBA', 'NFL', 'MLB', 'NHL')
 * @returns ESPN teams response
 */
export async function fetchTeams({ league }: { league: string }): Promise<ESPNTeamsResponse> {
  const mapping = LEAGUE_MAP[league.toUpperCase()]

  if (!mapping) {
    throw new Error(`Unsupported league: ${league}. Supported: ${Object.keys(LEAGUE_MAP).join(', ')}`)
  }

  const { sport, league: espnLeague } = mapping
  const url = `${ESPN_BASE_URL}/${sport}/${espnLeague}/teams`

  logger.info('Fetching teams from ESPN', { league, sport, espnLeague })

  const json = await fetchWithRetry(url)

  return json as ESPNTeamsResponse
}
