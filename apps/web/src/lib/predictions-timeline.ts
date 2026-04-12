import type { ParlayWithLegs, PredictionWithGame } from '@/types/api'
import type { LeagueFilter, ResultFilter, StatusFilter } from '@/types/filters'

export type TimelineItem =
  | { kind: 'single'; createdAt: string; prediction: PredictionWithGame }
  | { kind: 'parlay'; createdAt: string; parlay: ParlayWithLegs }

export function getSingleTimelineStatus(
  prediction: PredictionWithGame
): 'pending' | 'live' | 'completed' {
  const game = prediction.game
  const hasResult = game.result != null
  const gameStarted = new Date(game.startsAt) <= new Date()
  if (hasResult) return 'completed'
  if (gameStarted) return 'live'
  return 'pending'
}

export function getParlayTimelineStatus(parlay: ParlayWithLegs): 'pending' | 'live' | 'completed' {
  if (parlay.status !== 'PENDING') return 'completed'
  const now = new Date()
  for (const leg of parlay.legs) {
    const g = leg.game
    const hasResult = g.result != null
    const started = new Date(g.startsAt) <= now
    if (started && !hasResult) return 'live'
  }
  return 'pending'
}

function parlayMatchesLeague(parlay: ParlayWithLegs, leagueFilter: LeagueFilter): boolean {
  if (leagueFilter === 'all') return true
  return parlay.legs.some((l) => l.game.league === leagueFilter)
}

function parlayMatchesResult(parlay: ParlayWithLegs, resultFilter: ResultFilter): boolean {
  if (resultFilter === 'all') return true
  if (resultFilter === 'wins') return parlay.status === 'WON'
  if (resultFilter === 'losses') return parlay.status === 'LOST'
  return true
}

export function matchesSingleFilters(
  prediction: PredictionWithGame,
  statusFilter: StatusFilter,
  leagueFilter: LeagueFilter,
  resultFilter: ResultFilter
): boolean {
  if (statusFilter !== 'all' && getSingleTimelineStatus(prediction) !== statusFilter) return false
  if (leagueFilter !== 'all' && prediction.game.league !== leagueFilter) return false
  if (resultFilter !== 'all') {
    if (prediction.outcome === null) return false
    if (resultFilter === 'wins' && prediction.outcome !== 'WIN') return false
    if (resultFilter === 'losses' && prediction.outcome !== 'LOSS') return false
  }
  return true
}

export function matchesParlayFilters(
  parlay: ParlayWithLegs,
  statusFilter: StatusFilter,
  leagueFilter: LeagueFilter,
  resultFilter: ResultFilter
): boolean {
  if (statusFilter !== 'all' && getParlayTimelineStatus(parlay) !== statusFilter) return false
  if (!parlayMatchesLeague(parlay, leagueFilter)) return false
  if (!parlayMatchesResult(parlay, resultFilter)) return false
  return true
}

export function buildMergedTimeline(
  predictions: PredictionWithGame[],
  parlays: ParlayWithLegs[]
): TimelineItem[] {
  const items: TimelineItem[] = [
    ...predictions.map((prediction) => ({
      kind: 'single' as const,
      createdAt: prediction.createdAt,
      prediction,
    })),
    ...parlays.map((parlay) => ({
      kind: 'parlay' as const,
      createdAt: parlay.createdAt,
      parlay,
    })),
  ]
  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  return items
}

export function filterTimeline(
  items: TimelineItem[],
  statusFilter: StatusFilter,
  leagueFilter: LeagueFilter,
  resultFilter: ResultFilter
): TimelineItem[] {
  return items.filter((item) =>
    item.kind === 'single'
      ? matchesSingleFilters(item.prediction, statusFilter, leagueFilter, resultFilter)
      : matchesParlayFilters(item.parlay, statusFilter, leagueFilter, resultFilter)
  )
}
