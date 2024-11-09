import { League } from '@/types/league'

export const APP_NAME = 'Pulse'
export const SUPPORTED_LEAGUES: League[] = [
  {
    sport: 'Baseball',
    league: 'MLB',
    id: 'mlb',
    odds: true,
    players: true,
    teams: true,
  },
  {
    sport: 'Basketball',
    league: 'NCAAB',
    id: 'ncaab',
    odds: true,
    players: true,
    teams: true,
  },
  {
    sport: 'Basketball',
    league: 'NBA',
    id: 'nba',
    odds: true,
    players: true,
    teams: true,
  },
  {
    sport: 'Basketball',
    league: 'WNBA',
    id: 'wnba',
    odds: true,
    players: true,
    teams: true,
  },
  {
    sport: 'eSports',
    league: 'CS2',
    id: 'cs2',
    odds: true,
    players: true,
    teams: false,
  },
  {
    sport: 'eSports',
    league: 'League of Legends',
    id: 'league_of_legends',
    odds: true,
    players: true,
    teams: false,
  },
  {
    sport: 'eSports',
    league: 'Valorant',
    id: 'valorant',
    odds: true,
    players: true,
    teams: false,
  },
  {
    sport: 'Football',
    league: 'NCAAF',
    id: 'ncaaf',
    odds: true,
    players: true,
    teams: true,
  },
  {
    sport: 'Football',
    league: 'NFL',
    id: 'nfl',
    odds: true,
    players: true,
    teams: true,
  },
  {
    sport: 'Hockey',
    league: 'NHL',
    id: 'nhl',
    odds: true,
    players: true,
    teams: true,
  },
  {
    sport: 'MMA',
    league: 'UFC',
    id: 'ufc',
    odds: true,
    players: false,
    teams: false,
  },
  {
    sport: 'Soccer',
    league: 'England Premier League',
    id: 'england_premier_league',
    odds: true,
    players: true,
    teams: false,
  },
  {
    sport: 'Soccer',
    league: 'Germany Bundesliga',
    id: 'germany_bundesliga',
    odds: true,
    players: false,
    teams: false,
  },
  {
    sport: 'Soccer',
    league: 'United States Major League Soccer',
    id: 'united_states_major_league_soccer',
    odds: true,
    players: true,
    teams: false,
  },
  {
    sport: 'Tennis',
    league: 'ATP',
    id: 'atp',
    odds: true,
    players: false,
    teams: false,
  },
  {
    sport: 'Tennis',
    league: 'WTA',
    id: 'wta',
    odds: true,
    players: false,
    teams: false,
  },
]

export const SUPPORTED_SPORTS = SUPPORTED_LEAGUES.reduce<string[]>((acc, curr) => {
  if (!acc.includes(curr.sport)) {
    acc.push(curr.sport)
  }
  return acc
}, [])
