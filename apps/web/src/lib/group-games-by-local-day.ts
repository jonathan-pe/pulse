import type { GameWithUnifiedOdds } from '@pulse/types'

export type GameDayGroup = {
  /** Local calendar date `YYYY-MM-DD` (for keys and stable ordering). */
  dateKey: string
  /** Human label: Today, Tomorrow, or a short weekday date. */
  label: string
  games: GameWithUnifiedOdds[]
}

function localDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatGroupLabel(dateKey: string, todayKey: string, tomorrowKey: string, currentYear: number): string {
  if (dateKey === todayKey) return 'Today'
  if (dateKey === tomorrowKey) return 'Tomorrow'

  const [ys, ms, ds] = dateKey.split('-')
  const y = Number(ys)
  const m = Number(ms)
  const day = Number(ds)
  const date = new Date(y, m - 1, day)

  if (y !== currentYear) {
    return new Intl.DateTimeFormat(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date)
  }

  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function sortByStartTime(games: GameWithUnifiedOdds[]): GameWithUnifiedOdds[] {
  return [...games].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
}

/**
 * Buckets games by kickoff **local calendar day**, ordered soonest day first.
 * Within each day, games are ordered by start time.
 */
export function groupGamesByLocalDay(games: GameWithUnifiedOdds[]): GameDayGroup[] {
  if (games.length === 0) return []

  const now = new Date()
  const todayKey = localDateKey(now)
  const tomorrowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  const tomorrowKey = localDateKey(tomorrowDate)
  const currentYear = now.getFullYear()

  const byKey = new Map<string, GameWithUnifiedOdds[]>()

  for (const game of games) {
    const key = localDateKey(new Date(game.startsAt))
    if (!byKey.has(key)) {
      byKey.set(key, [])
    }
    byKey.get(key)!.push(game)
  }

  const dayOrder = [...byKey.keys()].sort((a, b) => a.localeCompare(b))

  return dayOrder.map((dateKey) => ({
    dateKey,
    label: formatGroupLabel(dateKey, todayKey, tomorrowKey, currentYear),
    games: sortByStartTime(byKey.get(dateKey)!),
  }))
}
