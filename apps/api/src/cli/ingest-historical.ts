#!/usr/bin/env tsx

/**
 * Historical Game Ingestion CLI
 *
 * Backfills past games from NatStat with auto-scoring for games with results.
 * Use this to populate historical data and score predictions made before ingestion was automated.
 *
 * Usage:
 *   pnpm ingest-historical <league> [days]
 *
 * Examples:
 *   pnpm ingest-historical NBA        # Ingest yesterday's NBA games
 *   pnpm ingest-historical NFL 7      # Ingest past 7 days of NFL games
 *   pnpm ingest-historical MLB 30     # Ingest past month of MLB games
 */

import { ingestNatStat } from '../jobs/ingest-natstat.js'

async function main() {
  const [league, daysStr = '1'] = process.argv.slice(2)

  if (!league) {
    // eslint-disable-next-line no-console
    console.error('Usage: pnpm ingest-historical <league> [days]')
    // eslint-disable-next-line no-console
    console.error('Example: pnpm ingest-historical NBA 7')
    process.exit(1)
  }

  const daysBack = parseInt(daysStr, 10)
  if (isNaN(daysBack) || daysBack < 1) {
    // eslint-disable-next-line no-console
    console.error('Error: days must be a positive integer')
    process.exit(1)
  }

  const validLeagues = ['MLB', 'NBA', 'NFL', 'NHL']
  if (!validLeagues.includes(league.toUpperCase())) {
    // eslint-disable-next-line no-console
    console.error(`Error: Invalid league "${league}"`)
    // eslint-disable-next-line no-console
    console.error(`Valid leagues: ${validLeagues.join(', ')}`)
    process.exit(1)
  }

  // eslint-disable-next-line no-console
  console.log(`\n🔄 Ingesting ${daysBack} day(s) of ${league.toUpperCase()} games...\n`)

  try {
    // Generate date range for past N days
    const dates: string[] = []
    for (let i = 1; i <= daysBack; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      dates.push(date.toISOString().split('T')[0])
    }

    let totalGamesScored = 0
    let totalScoresUpdated = 0

    for (const date of dates) {
      // eslint-disable-next-line no-console
      console.log(`Processing ${date}...`)

      const result = await ingestNatStat({
        date,
        league: league.toUpperCase(),
      })

      totalGamesScored += result.counts.gamesScored
      totalScoresUpdated += result.counts.scoresUpdated
    }

    // eslint-disable-next-line no-console
    console.log('\n✅ Historical Ingestion Summary:')
    // eslint-disable-next-line no-console
    console.log(`   League: ${league.toUpperCase()}`)
    // eslint-disable-next-line no-console
    console.log(`   Days Processed: ${daysBack}`)
    // eslint-disable-next-line no-console
    console.log(`   Game Scores Updated: ${totalScoresUpdated}`)
    // eslint-disable-next-line no-console
    console.log(`   Games Auto-Scored: ${totalGamesScored}`)

    process.exit(0)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('\n❌ Historical ingestion failed:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Fatal error:', error)
  process.exit(1)
})
