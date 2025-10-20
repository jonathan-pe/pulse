import crypto from 'crypto'

const NATSTAT_BASE_URL = process.env.NATSTAT_BASE_URL ?? 'https://api3.natst.at'
const NATSTAT_API_KEY = process.env.NATSTAT_API_KEY ?? ''
const NATSTAT_AUTH_SCHEME = process.env.NATSTAT_AUTH_SCHEME ?? 'x-api-key'
const NATSTAT_TIMEOUT_MS = Number(process.env.NATSTAT_TIMEOUT_MS ?? 10000)

function buildHeaders() {
  const headers: Record<string, string> = { accept: 'application/json' }
  const key = NATSTAT_API_KEY
  if (!key) return headers

  if (NATSTAT_AUTH_SCHEME === 'x-api-key') {
    headers['x-api-key'] = key
  } else if (NATSTAT_AUTH_SCHEME === 'bearer') {
    headers['authorization'] = `Bearer ${key}`
  } else if (NATSTAT_AUTH_SCHEME.startsWith('header:')) {
    const name = NATSTAT_AUTH_SCHEME.split(':', 2)[1]
    if (name) headers[name] = key
  }

  return headers
}

async function fetchWithRetry(url: string, opts: any = {}, retries = 1): Promise<any> {
  const headers = { ...(opts.headers ?? {}), ...buildHeaders() }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), NATSTAT_TIMEOUT_MS)

  try {
    // Use global fetch (Node 18+) or a polyfill available in the runtime. Keep typing loose here.
    const res = await (globalThis as any).fetch(url, { ...opts, headers, signal: controller.signal })

    if (res.status === 429) {
      // caller should handle scheduling/backoff
      const text = await res.text().catch(() => '')
      throw new Error(`natstat: rate limited (429) ${text}`)
    }

    if (res.status >= 500 && retries > 0) {
      // jittered backoff
      const wait = 200 + Math.floor(Math.random() * 600)
      await new Promise((r) => setTimeout(r, wait))
      return fetchWithRetry(url, opts, retries - 1)
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`natstat: ${res.status} ${text}`)
    }

    return res.json()
  } finally {
    clearTimeout(timeout)
  }
}

export type RawNatStatLine = any

/**
 * Load forecasts from NatStat's unified /forecasts endpoint.
 * This endpoint provides moneyline, spread, and over/under all in one response.
 * @param league - Sport code (e.g., 'pfb' for NFL, 'nba', 'mlb', 'nhl')
 * @param date - Date in YYYY-MM-DD format (optional, defaults to today)
 */
export async function loadForecasts({ league, date }: { league: string; date?: string }): Promise<any> {
  // Build URL: https://api3.natst.at/{API_KEY}/forecasts/{league}/{date}
  const parts = [NATSTAT_BASE_URL, NATSTAT_API_KEY, 'forecasts', league.toLowerCase()]
  if (date) parts.push(date)

  const url = parts.join('/')

  const json = await fetchWithRetry(url, { method: 'GET' })

  // Return the full JSON payload
  return json
}

/**
 * Load team codes from NatStat's /teamcodes endpoint.
 * This endpoint provides team IDs, codes, names, and metadata.
 * @param league - Sport code (e.g., 'pfb' for NFL, 'nba', 'mlb', 'nhl')
 */
export async function loadTeamCodes({ league }: { league: string }): Promise<any> {
  // Build URL: https://api3.natst.at/{API_KEY}/teamcodes/{league}
  const url = `${NATSTAT_BASE_URL}/${NATSTAT_API_KEY}/teamcodes/${league.toLowerCase()}`

  const json = await fetchWithRetry(url, { method: 'GET' })

  // Return the full JSON payload
  return json
}

/**
 * @deprecated Use loadForecasts instead - the /forecasts endpoint provides all markets in one call
 */
export async function loadMarket({
  market,
  league,
  date,
}: {
  market: string
  league?: string
  date?: string
}): Promise<any> {
  // NatStat endpoint naming may vary; use a generic odds endpoint with query params.
  const url = new URL(`${NATSTAT_BASE_URL}/${NATSTAT_API_KEY}/${market}/${league ?? ''}/${date ?? ''}`)

  const json = await fetchWithRetry(url.toString(), { method: 'GET' })

  // Return the full JSON payload — normalizer expects wrapper objects like { overunders: { ... } } or { data: [...] }
  return json
}

export function eventIdentityKey(item: any) {
  // Prefer provider event id, else hash league|date|home|away
  if (item?.eventId) return String(item.eventId)
  const parts = [
    item.league ?? '',
    item.startsAt ?? item.date ?? '',
    item.home ?? item.homeTeam ?? '',
    item.away ?? item.awayTeam ?? '',
  ]
  return crypto.createHash('md5').update(parts.join('|')).digest('hex')
}
