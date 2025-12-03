export type StatusFilter = 'all' | 'pending' | 'live' | 'completed'
export type LeagueFilter = 'all' | 'NBA' | 'NFL' | 'MLB' | 'NHL'
export type ResultFilter = 'all' | 'wins' | 'losses'

export interface PredictionsFiltersValue {
  status: StatusFilter
  league: LeagueFilter
  result: ResultFilter
}
