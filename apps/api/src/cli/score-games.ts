#!/usr/bin/env tsx
/**
 * CLI: Score Games
 *
 * Score all completed games that haven't been processed yet.
 *
 * Usage:
 *   pnpm cli score-games
 *   node --loader tsx src/cli/score-games.ts
 */

import { scoreGamesJob } from '../jobs/score-games'

async function main() {
  console.log('🎯 Starting game scoring...\n')

  const result = await scoreGamesJob()

  console.log('\n📊 Results:')
  console.log(`   Games scored: ${result.gamesScored}`)
  console.log(`   Predictions scored: ${result.predictionsScored}`)
  console.log(`   Points awarded: ${result.pointsAwarded}`)
  console.log(`   Duration: ${result.duration}ms`)

  if (result.errors.length > 0) {
    console.log(`\n⚠️  Errors (${result.errors.length}):`)
    result.errors.forEach((error, i) => {
      console.log(`   ${i + 1}. ${error}`)
    })
  }

  if (result.success) {
    console.log('\n✅ Scoring completed successfully')
    process.exit(0)
  } else {
    console.log('\n❌ Scoring failed')
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
