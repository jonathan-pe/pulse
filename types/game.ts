// https://data.oddsblaze.com/v1/odds/{sportsbook_id}_{league_id}.json

export interface Team {
  id: string
  name: string
  abbreviation: string
}

// TODO: double check this is correct
export interface Player {
  id: string
  name: string
  position: string
  team: Team
}

export interface Odds {
  id: string
  group: string
  market: string
  name: string
  main: boolean
  price: string
  points: number | null
  selection: string
  link: string
  sgp: string
  grade: string
  players: Player[]
  updated: string
}

export interface Odds_Sportsbook {
  id: string
  name: string
  odds: Odds[]
}

export interface Game {
  id: string
  sport: string
  league: string
  teams: {
    away: Team
    home: Team
  }
  start: string
  status: string
  live: boolean
  tournament: string // name of event? (e.g. "Brooklyn Nets at New Orleans Pelicans")
  sportsbooks: Odds_Sportsbook[]
}

export interface ApiResponse {
  games: Game[]
}
