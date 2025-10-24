#!/usr/bin/env node
import 'dotenv/config'
import { ingestNatStat } from '../jobs/ingest-natstat.js'
import { createLogger } from '../lib/logger.js'

const logger = createLogger('CLI:Ingest')

async function main() {
  const date = process.argv[2]
  const league = process.argv[3]

  if (!league) {
    // Use console for usage instructions (not operational logging)
    // eslint-disable-next-line no-console
    console.error('Usage: pnpm ingest [date] <league>')
    // eslint-disable-next-line no-console
    console.error('  date:   Optional. YYYY-MM-DD or YYYY-MM-DD,YYYY-MM-DD range. Defaults to today.')
    // eslint-disable-next-line no-console
    console.error('  league: Required. One of: NFL, NBA, MLB, NHL')
    // eslint-disable-next-line no-console
    console.error('')
    // eslint-disable-next-line no-console
    console.error('Examples:')
    // eslint-disable-next-line no-console
    console.error('  pnpm ingest NFL                      # Ingest today for NFL')
    // eslint-disable-next-line no-console
    console.error('  pnpm ingest 2025-10-19 NFL           # Ingest specific date')
    // eslint-disable-next-line no-console
    console.error('  pnpm ingest "2025-10-19,2025-10-26" NFL  # Ingest date range')
    process.exit(1)
  }

  logger.info('Starting NatStat ingestion CLI', { league, date: date ?? 'today' })

  const res = await ingestNatStat({ date, league })

  logger.info('Ingestion completed successfully', res.counts)

  // Output result for script consumption
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(res, null, 2))
}

main().catch((err) => {
  logger.error('Ingestion failed', err instanceof Error ? err : undefined)
  process.exit(1)
})
