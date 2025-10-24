#!/usr/bin/env node
import 'dotenv/config'
import { syncNatStatTeams } from '../jobs/sync-natstat-teams.js'
import { createLogger } from '../lib/logger.js'

const logger = createLogger('CLI:SyncTeams')

async function main() {
  const league = process.argv[2]

  if (!league) {
    // Use console for usage instructions (not operational logging)
    // eslint-disable-next-line no-console
    console.error('Usage: pnpm sync-teams <league>')
    // eslint-disable-next-line no-console
    console.error('  league: Required. One of: NFL, NBA, MLB, NHL')
    // eslint-disable-next-line no-console
    console.error('')
    // eslint-disable-next-line no-console
    console.error('Examples:')
    // eslint-disable-next-line no-console
    console.error('  pnpm sync-teams NFL')
    // eslint-disable-next-line no-console
    console.error('  pnpm sync-teams NBA')
    process.exit(1)
  }

  logger.info('Starting NatStat team sync CLI', { league })

  const res = await syncNatStatTeams({ league })

  logger.info('Team sync completed successfully', res)

  // Output result for script consumption
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(res, null, 2))
}

main().catch((err) => {
  logger.error('Team sync failed', err instanceof Error ? err : undefined)
  process.exit(1)
})
