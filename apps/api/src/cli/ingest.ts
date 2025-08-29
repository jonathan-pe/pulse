#!/usr/bin/env node
import 'dotenv/config'
import { ingestNatStat } from '../jobs/ingest-natstat'

async function main() {
  const date = process.argv[2]
  const league = process.argv[3]
  const res = await ingestNatStat({ date, league })
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(res, null, 2))
}

if (require.main === module)
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
