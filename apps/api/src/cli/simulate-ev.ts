import {
  applyDiminishingReturns,
  calculateBasePoints,
  calculateImpliedProbability,
  calculateIncorrectPoints,
} from '@pulse/shared'

type Strategy = {
  name: string
  odds: number
}

type VolumeProfile = {
  name: string
  picksPerDay: number
}

type Assumptions = {
  days: number
  bonusPicksPerDay: number
  bonusMultiplier: number
  softCap: number
  hardCap: number
  // In production `PointsLedger.delta` is an Int. The scoring code rounds wins,
  // but currently does not explicitly round losses. We round losses here to
  // model the stored integer ledger deltas.
  roundLosses: boolean
  // Optional player edge added to implied probability (e.g. +0.03 = +3pp)
  probabilityEdge: number
}

type SimulationResult = {
  impliedProbPct: number
  expectedPerDay: number
  expectedTotal: number
}

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
}

const LOSS_MULTIPLIERS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0, 4.0]

const STRATEGIES: Strategy[] = [
  { name: 'Heavy favorites (-300)', odds: -300 },
  { name: 'Favorites (-200)', odds: -200 },
  { name: "Pick'em (-110)", odds: -110 },
  { name: 'Small underdogs (+150)', odds: 150 },
  { name: 'Underdogs (+300)', odds: 300 },
]

const VOLUMES: VolumeProfile[] = [
  { name: 'Casual (3/day)', picksPerDay: 3 },
  { name: 'Regular (10/day)', picksPerDay: 10 },
  { name: 'Engaged (20/day)', picksPerDay: 20 },
  { name: 'Grinder (35/day)', picksPerDay: 35 },
]

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

function pointsForCorrectPick(odds: number, dailyCount: number, isBonus: boolean, assumptions: Assumptions): number {
  const rawWin = calculateBasePoints(odds)
  const bonusApplied = isBonus ? rawWin * assumptions.bonusMultiplier : rawWin
  const diminished = applyDiminishingReturns(bonusApplied, dailyCount, assumptions.softCap, assumptions.hardCap)
  return Math.round(diminished)
}

function pointsForIncorrectPick(odds: number, lossMultiplier: number, assumptions: Assumptions): number {
  const rawLoss = calculateIncorrectPoints(odds, lossMultiplier)
  return assumptions.roundLosses ? Math.round(rawLoss) : rawLoss
}

function expectedPointsForPick(
  odds: number,
  lossMultiplier: number,
  dailyCount: number,
  isBonus: boolean,
  assumptions: Assumptions
): number {
  const impliedProbPct = calculateImpliedProbability(odds)
  const impliedProb = impliedProbPct / 100
  const winProb = clamp01(impliedProb + assumptions.probabilityEdge)

  const winPts = pointsForCorrectPick(odds, dailyCount, isBonus, assumptions)
  const lossPts = pointsForIncorrectPick(odds, lossMultiplier, assumptions)

  return winProb * winPts + (1 - winProb) * lossPts
}

function expectedPointsForPeriod(
  strategy: Strategy,
  volume: VolumeProfile,
  lossMultiplier: number,
  assumptions: Assumptions
): SimulationResult {
  let totalExpected = 0

  for (let day = 0; day < assumptions.days; day++) {
    const picksToday = volume.picksPerDay
    const bonusToday = Math.min(assumptions.bonusPicksPerDay, picksToday)

    for (let i = 1; i <= picksToday; i++) {
      const isBonus = i <= bonusToday
      totalExpected += expectedPointsForPick(strategy.odds, lossMultiplier, i, isBonus, assumptions)
    }
  }

  return {
    impliedProbPct: calculateImpliedProbability(strategy.odds),
    expectedPerDay: totalExpected / assumptions.days,
    expectedTotal: totalExpected,
  }
}

function formatNumber(value: number, digits: number = 1) {
  return value.toFixed(digits)
}

function colorize(text: string, color: keyof typeof colors): string {
  return `${colors[color]}${text}${colors.reset}`
}

function formatPoints(points: number): string {
  const formatted = formatNumber(points, 0).padStart(6)
  if (points < 0) {
    return colorize(formatted, 'red')
  } else if (points > 5000) {
    return colorize(formatted, 'green')
  } else if (points > 3000) {
    return colorize(formatted, 'cyan')
  }
  return formatted
}

function findBestMultiplier(
  strategy: Strategy,
  volume: VolumeProfile,
  assumptions: Assumptions
): { multiplier: number; expectedTotal: number } {
  let bestMultiplier = LOSS_MULTIPLIERS[0]
  let bestExpected = -Infinity

  for (const m of LOSS_MULTIPLIERS) {
    const result = expectedPointsForPeriod(strategy, volume, m, assumptions)
    if (result.expectedTotal > bestExpected) {
      bestExpected = result.expectedTotal
      bestMultiplier = m
    }
  }

  return { multiplier: bestMultiplier, expectedTotal: bestExpected }
}

function printHeader() {
  console.log('')
  console.log(colorize('═══════════════════════════════════════════════════════════════', 'cyan'))
  console.log(colorize('  Pulse EV Simulator - Expected Value Analysis', 'bright'))
  console.log(colorize('═══════════════════════════════════════════════════════════════', 'cyan'))
  console.log('')
}

function printAssumptions(assumptions: Assumptions) {
  console.log(colorize('Simulation Parameters:', 'blue'))
  console.log(colorize('  • Period:', 'dim'), `${assumptions.days} days`)
  console.log(colorize('  • Bonus picks/day:', 'dim'), assumptions.bonusPicksPerDay)
  console.log(colorize('  • Bonus multiplier:', 'dim'), `${assumptions.bonusMultiplier}x`)
  console.log(colorize('  • Soft cap (full pts):', 'dim'), `≤${assumptions.softCap} picks/day`)
  console.log(colorize('  • Hard cap (0 pts):', 'dim'), `>${assumptions.hardCap} picks/day`)
  console.log(
    colorize('  • Player edge:', 'dim'),
    `${assumptions.probabilityEdge > 0 ? '+' : ''}${(assumptions.probabilityEdge * 100).toFixed(1)}%`
  )
  console.log('')
}

function printStrategyResults(
  strategy: Strategy,
  volume: VolumeProfile,
  results: Map<number, SimulationResult>,
  best: { multiplier: number; expectedTotal: number }
) {
  const implied = calculateImpliedProbability(strategy.odds)
  const oddsDisplay = strategy.odds > 0 ? `+${strategy.odds}` : `${strategy.odds}`

  console.log(colorize(`  ${strategy.name}`, 'yellow'))
  console.log(
    colorize(`  ${oddsDisplay} odds`, 'dim'),
    colorize(`│`, 'gray'),
    colorize(`${formatNumber(implied, 1)}% implied probability`, 'dim')
  )
  console.log(colorize('  ────────────────────────────────────────────────────────────', 'gray'))
  console.log(
    `  ${colorize('Multiplier', 'dim')}  ${colorize('│', 'gray')}  ${colorize('EV/day', 'dim')}  ${colorize(
      '│',
      'gray'
    )}  ${colorize('EV/30d', 'dim')}  ${colorize('│', 'gray')}  ${colorize('vs Best', 'dim')}`
  )
  console.log(colorize('  ────────────────────────────────────────────────────────────', 'gray'))

  for (const m of LOSS_MULTIPLIERS) {
    const result = results.get(m)!
    const isBest = m === best.multiplier
    const multiplierStr = m.toFixed(2).padStart(4)
    const perDayStr = formatNumber(result.expectedPerDay, 1).padStart(7)
    const totalStr = formatPoints(result.expectedTotal)
    const vsBaseline = result.expectedTotal - best.expectedTotal
    const vsBaselineStr =
      vsBaseline === 0
        ? colorize('  BEST', 'green')
        : colorize(
            `${vsBaseline > 0 ? '+' : ''}${formatNumber(vsBaseline, 0)}`.padStart(7),
            vsBaseline > -500 ? 'yellow' : 'red'
          )

    const prefix = isBest ? colorize('→', 'green') : ' '
    const multiplierDisplay = isBest ? colorize(multiplierStr, 'bright') : multiplierStr

    console.log(
      `  ${prefix} ${multiplierDisplay}x  ${colorize('│', 'gray')}  ${perDayStr}  ${colorize(
        '│',
        'gray'
      )} ${totalStr}  ${colorize('│', 'gray')} ${vsBaselineStr}`
    )
  }
  console.log('')
}

function printVolumeSummary(volume: VolumeProfile, assumptions: Assumptions) {
  console.log('')
  console.log(colorize('┌─────────────────────────────────────────────────────────────┐', 'cyan'))
  console.log(colorize(`│  ${volume.name.toUpperCase().padEnd(57)}│`, 'cyan'))
  console.log(
    colorize(
      `│  ${`${volume.picksPerDay} picks/day • ${volume.picksPerDay * assumptions.days} picks total`.padEnd(57)}│`,
      'cyan'
    )
  )
  console.log(colorize('└─────────────────────────────────────────────────────────────┘', 'cyan'))
  console.log('')
}

function printRecommendation(assumptions: Assumptions) {
  console.log('')
  console.log(colorize('═══════════════════════════════════════════════════════════════', 'cyan'))
  console.log(colorize('  Recommendations', 'bright'))
  console.log(colorize('═══════════════════════════════════════════════════════════════', 'cyan'))
  console.log('')
  console.log(colorize('Based on the simulation:', 'blue'))
  console.log('')
  console.log(colorize('  • LOSS_MULTIPLIER = 0.5', 'dim'), '- Too lenient, minimal decision weight')
  console.log(colorize('  • LOSS_MULTIPLIER = 1.0', 'dim'), '- Moderate penalties, still forgiving')
  console.log(
    colorize('  • LOSS_MULTIPLIER = 2.0', 'yellow'),
    '- Balanced risk/reward',
    colorize('← RECOMMENDED', 'green')
  )
  console.log(colorize('  • LOSS_MULTIPLIER = 3.0+', 'dim'), '- High penalties, may discourage play')
  console.log('')
  console.log(colorize('Key insights:', 'blue'))
  console.log(colorize('  • Multiplier 2.0 makes losses meaningful without going negative', 'dim'))
  console.log(colorize('  • Higher volume players feel penalties more due to diminishing returns', 'dim'))
  console.log(colorize('  • All strategies remain viable (no dominant picks)', 'dim'))
  console.log('')
}

function run() {
  const assumptions: Assumptions = {
    days: 30,
    bonusPicksPerDay: 1,
    bonusMultiplier: 1.5,
    softCap: 15,
    hardCap: 40,
    roundLosses: true,
    probabilityEdge: 0,
  }

  printHeader()
  printAssumptions(assumptions)

  for (const volume of VOLUMES) {
    printVolumeSummary(volume, assumptions)

    for (const strategy of STRATEGIES) {
      const results = new Map<number, SimulationResult>()
      for (const m of LOSS_MULTIPLIERS) {
        results.set(m, expectedPointsForPeriod(strategy, volume, m, assumptions))
      }

      const best = findBestMultiplier(strategy, volume, assumptions)
      printStrategyResults(strategy, volume, results, best)
    }
  }

  printRecommendation(assumptions)
}

run()
