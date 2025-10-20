#!/usr/bin/env node
import 'dotenv/config'
import { ingestNatStat } from '../jobs/ingest-natstat.js'

async function main() {
  const date = process.argv[2]
  const league = process.argv[3]

  if (!league) {
    console.error('Usage: pnpm ingest [date] <league>')
    console.error('  date:   Optional. YYYY-MM-DD or YYYY-MM-DD,YYYY-MM-DD range. Defaults to today.')
    console.error('  league: Required. One of: NFL, NBA, MLB, NHL')
    console.error('')
    console.error('Examples:')
    console.error('  pnpm ingest NFL                      # Ingest today for NFL')
    console.error('  pnpm ingest 2025-10-19 NFL           # Ingest specific date')
    console.error('  pnpm ingest "2025-10-19,2025-10-26" NFL  # Ingest date range')
    process.exit(1)
  }

  console.log(`Starting NatStat ingestion for ${league}${date ? ` (${date})` : ' (today)'}...`)

  const res = await ingestNatStat({ date, league })

  // eslint-disable-next-line no-console
  console.log('\nIngestion completed:')
  console.log(JSON.stringify(res, null, 2))
}

main().catch((err) => {
  console.error('\nIngestion failed:')
  console.error(err)
  process.exit(1)
})
