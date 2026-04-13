#!/usr/bin/env node
import '../load-env.js'
import { pathToFileURL } from 'node:url'
import { ingestNatStat } from '../jobs/ingest-natstat.js'
import { createLogger } from '../lib/logger.js'

const logger = createLogger('CLI:Ingest')

const LOOKBACK_DAYS = 3
const LOOKAHEAD_DAYS = 3

const VALID_LEAGUES = ['MLB', 'NBA', 'NFL', 'NHL'] as const

type ParsedIngestArgs = {
  leagues?: string[]
  date?: string
}

export function buildDefaultDateRange(referenceDate = new Date()) {
  const today = new Date(referenceDate)
  today.setHours(0, 0, 0, 0)

  const start = new Date(today)
  start.setDate(today.getDate() - LOOKBACK_DAYS)

  const end = new Date(today)
  end.setDate(today.getDate() + LOOKAHEAD_DAYS)

  const isoStart = start.toISOString().slice(0, 10)
  const isoEnd = end.toISOString().slice(0, 10)

  return `${isoStart},${isoEnd}`
}

export function parseLeagueArg(leagueArg: string): string[] {
  return leagueArg
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
}

export function parseIngestArgs(args: string[]): ParsedIngestArgs {
  const [leagueArg, date] = args

  if (!leagueArg) {
    return {}
  }

  const leagues = parseLeagueArg(leagueArg)
  if (leagues.length === 0) {
    return {}
  }

  return {
    leagues,
    date: date ?? buildDefaultDateRange(),
  }
}

function printUsage() {
  // Use console for usage instructions (not operational logging)
  // eslint-disable-next-line no-console
  console.error('Usage: pnpm ingest <league[,league...]> [date]')
  // eslint-disable-next-line no-console
  console.error('  league: Required. One or more of: NFL, NBA, MLB, NHL (comma-separated for multiple)')
  // eslint-disable-next-line no-console
  console.error('  date:   Optional. YYYY-MM-DD or YYYY-MM-DD,YYYY-MM-DD range.')
  // eslint-disable-next-line no-console
  console.error(`          Defaults to ${LOOKBACK_DAYS} days ago through ${LOOKAHEAD_DAYS} days ahead.`)
  // eslint-disable-next-line no-console
  console.error('')
  // eslint-disable-next-line no-console
  console.error('Examples:')
  // eslint-disable-next-line no-console
  console.error('  pnpm ingest NBA                           # Ingest default date window')
  // eslint-disable-next-line no-console
  console.error('  pnpm ingest NFL,NBA                       # Same window, multiple leagues')
  // eslint-disable-next-line no-console
  console.error('  pnpm ingest NBA 2025-10-19                # Ingest specific date')
  // eslint-disable-next-line no-console
  console.error('  pnpm ingest NBA "2025-10-19,2025-10-26"   # Ingest date range')
}

function validateLeagues(leagues: string[]): string | undefined {
  const invalid = leagues.filter((l) => !VALID_LEAGUES.includes(l as (typeof VALID_LEAGUES)[number]))
  if (invalid.length === 0) {
    return undefined
  }
  return `Invalid league(s): ${invalid.join(', ')}. Valid: ${VALID_LEAGUES.join(', ')}`
}

async function main() {
  const { leagues, date } = parseIngestArgs(process.argv.slice(2))

  if (!leagues?.length) {
    printUsage()
    process.exit(1)
  }

  const validationError = validateLeagues(leagues)
  if (validationError) {
    // eslint-disable-next-line no-console
    console.error(validationError)
    process.exit(1)
  }

  logger.info('Starting NatStat ingestion CLI', { leagues, date })

  type IngestResult = Awaited<ReturnType<typeof ingestNatStat>>
  const results: ({ league: string } & IngestResult)[] = []

  for (const league of leagues) {
    const res = await ingestNatStat({ date, league })
    results.push({ league, ...res })
    logger.info('League ingestion finished', { league, counts: res.counts })
  }

  const combinedCounts = {
    datesProcessed: results.reduce((sum, r) => sum + r.counts.datesProcessed, 0),
    events: results.reduce((sum, r) => sum + r.counts.events, 0),
    games: results.reduce((sum, r) => sum + r.counts.games, 0),
    oddsLines: results.reduce((sum, r) => sum + r.counts.oddsLines, 0),
    scoresUpdated: results.reduce((sum, r) => sum + r.counts.scoresUpdated, 0),
    gamesScored: results.reduce((sum, r) => sum + r.counts.gamesScored, 0),
  }

  logger.info('Ingestion completed successfully', combinedCounts)

  // Output result for script consumption (single-league shape unchanged for backward compatibility)
  // eslint-disable-next-line no-console
  if (results.length === 1) {
    const [only] = results
    const { league: _l, ...single } = only
    console.log(JSON.stringify(single, null, 2))
  } else {
    console.log(JSON.stringify({ ok: true, leagues: results, combinedCounts }, null, 2))
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    logger.error('Ingestion failed', err instanceof Error ? err : undefined)
    process.exit(1)
  })
}
