#!/usr/bin/env node
import 'dotenv/config'
import { pathToFileURL } from 'node:url'
import { ingestNatStat } from '../jobs/ingest-natstat.js'
import { createLogger } from '../lib/logger.js'

const logger = createLogger('CLI:Ingest')

const LOOKBACK_DAYS = 7
const LOOKAHEAD_DAYS = 7

type ParsedIngestArgs = {
  league?: string
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

export function parseIngestArgs(args: string[]): ParsedIngestArgs {
  const [league, date] = args

  if (!league) {
    return {}
  }

  return {
    league: league.toUpperCase(),
    date: date ?? buildDefaultDateRange(),
  }
}

function printUsage() {
  // Use console for usage instructions (not operational logging)
  // eslint-disable-next-line no-console
  console.error('Usage: pnpm ingest <league> [date]')
  // eslint-disable-next-line no-console
  console.error('  league: Required. One of: NFL, NBA, MLB, NHL')
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
  console.error('  pnpm ingest NBA 2025-10-19                # Ingest specific date')
  // eslint-disable-next-line no-console
  console.error('  pnpm ingest NBA "2025-10-19,2025-10-26"   # Ingest date range')
}

async function main() {
  const { league, date } = parseIngestArgs(process.argv.slice(2))

  if (!league) {
    printUsage()
    process.exit(1)
  }

  logger.info('Starting NatStat ingestion CLI', { league, date })

  const res = await ingestNatStat({ date, league })

  logger.info('Ingestion completed successfully', res.counts)

  // Output result for script consumption
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(res, null, 2))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    logger.error('Ingestion failed', err instanceof Error ? err : undefined)
    process.exit(1)
  })
}
