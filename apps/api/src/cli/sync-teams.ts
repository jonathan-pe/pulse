#!/usr/bin/env node
import 'dotenv/config'
import { syncNatStatTeams } from '../jobs/sync-natstat-teams.js'

async function main() {
  const league = process.argv[2]

  if (!league) {
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

  // eslint-disable-next-line no-console
  console.log(`Syncing NatStat teams for ${league}...`)

  const res = await syncNatStatTeams({ league })

  // eslint-disable-next-line no-console
  console.log('\nSync completed:')
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(res, null, 2))
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('\nTeam sync failed:')
  // eslint-disable-next-line no-console
  console.error(err)
  process.exit(1)
})
