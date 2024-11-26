import { gql } from 'graphql-request'

export const Team_GamesFragment = gql`
  fragment Team_GamesFragment on Team {
    id
    name
    abbreviation
  }
`

export const OddsFragment = gql`
  fragment OddsFragment on Odd {
    id
    group
    market
    name
    main
    price
    points
    selection
    link
    sgp
    grade
  }
`

export const SportsbookFragment = gql`
  fragment SportsbookFragment on OddsSportsbook {
    id
    name
    odds {
      ...OddsFragment
    }
  }
  ${OddsFragment}
`

export const GameFragment = gql`
  fragment GameFragment on Game {
    id
    sport
    league
    teams {
      home {
        ...Team_GamesFragment
      }
      away {
        ...Team_GamesFragment
      }
    }
    start
    status
    live
    tournament
    sportsbooks {
      ...SportsbookFragment
    }
  }
  ${Team_GamesFragment}
  ${SportsbookFragment}
`
