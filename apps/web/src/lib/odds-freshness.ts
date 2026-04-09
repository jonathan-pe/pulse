import type { GameWithUnifiedOdds } from '@pulse/types'

export function getLatestOddsUpdatedAt(games: GameWithUnifiedOdds[]): Date | null {
  let latestMs = Number.NEGATIVE_INFINITY

  for (const game of games) {
    const raw = game.oddsUpdatedAt
    if (!raw) continue
    const ms = new Date(raw).getTime()
    if (!Number.isFinite(ms)) continue
    if (ms > latestMs) latestMs = ms
  }

  if (!Number.isFinite(latestMs)) return null
  return new Date(latestMs)
}

export function formatRelativeTime(value?: Date | string | null): string {
  if (!value) return ''

  const timestamp = new Date(value).getTime()
  if (!Number.isFinite(timestamp)) return ''

  const diffSeconds = Math.round((Date.now() - timestamp) / 1000)
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

  if (Math.abs(diffSeconds) < 60) return rtf.format(-diffSeconds, 'second')

  const diffMinutes = Math.round(diffSeconds / 60)
  if (Math.abs(diffMinutes) < 60) return rtf.format(-diffMinutes, 'minute')

  const diffHours = Math.round(diffMinutes / 60)
  if (Math.abs(diffHours) < 24) return rtf.format(-diffHours, 'hour')

  const diffDays = Math.round(diffHours / 24)
  return rtf.format(-diffDays, 'day')
}
