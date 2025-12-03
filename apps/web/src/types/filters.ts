import type { League } from '@pulse/types'

export type StatusFilter = 'all' | 'pending' | 'live' | 'completed'
export type LeagueFilter = 'all' | League
export type ResultFilter = 'all' | 'wins' | 'losses'

export interface PredictionsFiltersValue {
  status: StatusFilter
  league: LeagueFilter
  result: ResultFilter
}
