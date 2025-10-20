import { describe, it, expect } from 'vitest'
import { normalizeForecasts, adjustSpreadSigns } from '../normalize'

// Sample forecast response from the new /forecasts endpoint
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const forecastSample: any = {
  forecasts: {
    forecast_17118: {
      visitor: 'Los Angeles Rams',
      'visitor-code': 'LAR',
      'score-vis': '35',
      home: 'Jacksonville Jaguars',
      'home-code': 'JAX',
      'score-home': '7',
      gamestatus: 'Final',
      'winner-code': 'LAR',
      'loser-code': 'JAX',
      gamedate: '2025-10-19 09:30:00',
      gameday: '2025-10-19',
      'game-number': '1',
      neutral: 'Y',
      venue: 'Wembley Stadium',
      'venue-code': '202153',
      url: 'https://natstat.com/pfb/game/H20251019larjax-1',
      forecast: {
        moneyline: {
          vismoneyline: '-175',
          homemoneyline: '+150',
          moneylinemovement: '202254',
          moneylinedrift: '-25',
          moneylinecorrect: 'Y',
        },
        overunder: {
          overunder: '44.5',
          overunderresult: 'Under',
        },
        spread: {
          spread: '-3.5',
          favourite: '2022531', // LAR team ID (away team is favorite)
          spreadcorrect: '2022541',
        },
        simulation: {
          'prediction-favourite-code': 'LAR',
          prediction: 'LAR 28, JAX 21',
          predictioncorrect: 'N',
        },
      },
    },
    forecast_17119: {
      visitor: 'New Orleans',
      'visitor-code': 'NOS',
      home: 'Chicago',
      'home-code': 'CHI',
      gamestatus: {},
      gamedate: '2025-10-19 13:00:00',
      gameday: '2025-10-19',
      'game-number': '1',
      venue: 'Soldier Field',
      'venue-code': '667',
      url: 'https://natstat.com/pfb/game/H20251019noschi-1',
      forecast: {
        moneyline: {
          vismoneyline: '+175',
          homemoneyline: '-210',
        },
        overunder: {
          overunder: '44.5',
        },
        spread: {
          spread: '-3.5',
          favourite: '667', // CHI team ID (home team is favorite)
        },
        simulation: {
          'prediction-favourite-code': 'CHI',
        },
      },
    },
  },
  success: '1',
  query: {
    uri: 'https://api3.natst.at/667c-ab7f0b/forecasts/pfb/2025-10-19',
    endpoint: 'forecasts',
    scope: 'PFB',
    range: '2025-10-19',
  },
  meta: {
    'processed-at': '2025-10-19 19:25:34',
    api: 'National Statistical API',
  },
}

describe('natstat normalizeForecasts', () => {
  it('parses forecast sample with all markets into normalized events', () => {
    const normalized = normalizeForecasts(forecastSample, 'NFL')
    expect(Array.isArray(normalized)).toBe(true)
    expect(normalized.length).toBe(2)

    // Check first game
    const ev1 = normalized[0]
    expect(ev1.provider).toBe('natstat')
    expect(ev1.externalEventId).toBe('17118')
    expect(ev1.league).toBe('NFL')
    expect(ev1.homeTeam).toBe('Jacksonville Jaguars')
    expect(ev1.awayTeam).toBe('Los Angeles Rams')
    expect(ev1.homeTeamCode).toBe('JAX')
    expect(ev1.awayTeamCode).toBe('LAR')
    expect(ev1.status).toBe('Final')
    expect(ev1.homeScore).toBe(7)
    expect(ev1.awayScore).toBe(35)

    // Should have 3 lines (moneyline, spread, overunder)
    expect(ev1.lines.length).toBe(3)

    // Check moneyline
    const mlLine = ev1.lines.find((l) => l.market === 'moneyline')
    expect(mlLine).toBeDefined()
    expect(mlLine?.moneylineHome).toBe(150)
    expect(mlLine?.moneylineAway).toBe(-175)

    // Check spread - should have raw spread value and favouriteId before adjustment
    const spreadLine = ev1.lines.find((l) => l.market === 'pointspread')
    expect(spreadLine).toBeDefined()
    expect(spreadLine?.spread).toBe(-3.5) // Raw spread value from API
    expect(spreadLine?.spreadFavouriteId).toBe('2022531') // LAR team ID

    // Check overunder
    const ouLine = ev1.lines.find((l) => l.market === 'overunder')
    expect(ouLine).toBeDefined()
    expect(ouLine?.total).toBe(44.5)
  })

  it('adjusts spread correctly when home team is favorite', () => {
    const homeTeamFavorite = {
      forecasts: {
        forecast_123: {
          visitor: 'Underdog Team',
          'visitor-code': 'UND',
          home: 'Favorite Team',
          'home-code': 'FAV',
          gamedate: '2025-10-20 13:00:00',
          forecast: {
            spread: {
              spread: '-7.5',
              favourite: '999', // FAV team ID
            },
            moneyline: {
              vismoneyline: '+250',
              homemoneyline: '-300',
            },
            overunder: {
              overunder: '42.5',
            },
          },
        },
      },
    }

    const normalized = normalizeForecasts(homeTeamFavorite, 'NFL')
    const spreadLineBefore = normalized[0].lines.find((l) => l.market === 'pointspread')
    expect(spreadLineBefore?.spread).toBe(-7.5) // Raw value
    expect(spreadLineBefore?.spreadFavouriteId).toBe('999')

    // Now adjust the spread sign using team ID mapping
    const teamIdToCode = new Map([['999', 'FAV']]) // FAV team ID maps to FAV code (home team)
    const adjusted = adjustSpreadSigns(normalized, teamIdToCode)
    const spreadLineAfter = adjusted[0].lines.find((l) => l.market === 'pointspread')

    // Home is favorite, so spread should remain negative
    expect(spreadLineAfter?.spread).toBe(-7.5)
    expect(spreadLineAfter?.spreadFavouriteId).toBeUndefined() // Should be removed after adjustment
  })

  it('adjusts spread correctly when away team is favorite', () => {
    const awayTeamFavorite = {
      forecasts: {
        forecast_124: {
          visitor: 'Favorite Team',
          'visitor-code': 'FAV',
          home: 'Underdog Team',
          'home-code': 'UND',
          gamedate: '2025-10-20 13:00:00',
          forecast: {
            spread: {
              spread: '-7.5',
              favourite: '888', // FAV team ID (away team)
            },
            moneyline: {
              vismoneyline: '-300',
              homemoneyline: '+250',
            },
            overunder: {
              overunder: '42.5',
            },
          },
        },
      },
    }

    const normalized = normalizeForecasts(awayTeamFavorite, 'NFL')
    const spreadLineBefore = normalized[0].lines.find((l) => l.market === 'pointspread')
    expect(spreadLineBefore?.spread).toBe(-7.5) // Raw value
    expect(spreadLineBefore?.spreadFavouriteId).toBe('888')

    // Now adjust the spread sign using team ID mapping
    const teamIdToCode = new Map([['888', 'FAV']]) // FAV team ID maps to FAV code (away team)
    const adjusted = adjustSpreadSigns(normalized, teamIdToCode)
    const spreadLineAfter = adjusted[0].lines.find((l) => l.market === 'pointspread')

    // Away is favorite, so home spread should be positive (negated)
    expect(spreadLineAfter?.spread).toBe(7.5)
    expect(spreadLineAfter?.spreadFavouriteId).toBeUndefined()
  })

  it('adjusts spread with positive value when away is favorite', () => {
    const positiveSpread = {
      forecasts: {
        forecast_125: {
          visitor: 'Strong Team',
          'visitor-code': 'STR',
          home: 'Weak Team',
          'home-code': 'WEK',
          gamedate: '2025-10-20 13:00:00',
          forecast: {
            spread: {
              spread: '+3.5', // Positive value
              favourite: '777', // STR team ID (away team)
            },
            moneyline: {
              vismoneyline: '-150',
              homemoneyline: '+130',
            },
            overunder: {
              overunder: '45.5',
            },
          },
        },
      },
    }

    const normalized = normalizeForecasts(positiveSpread, 'NFL')
    const spreadLineBefore = normalized[0].lines.find((l) => l.market === 'pointspread')
    expect(spreadLineBefore?.spread).toBe(3.5) // Raw value
    expect(spreadLineBefore?.spreadFavouriteId).toBe('777')

    // Now adjust the spread sign using team ID mapping
    const teamIdToCode = new Map([['777', 'STR']]) // STR team ID maps to STR code (away team)
    const adjusted = adjustSpreadSigns(normalized, teamIdToCode)
    const spreadLineAfter = adjusted[0].lines.find((l) => l.market === 'pointspread')

    // Away is favorite, so home gets negative of the raw spread
    expect(spreadLineAfter?.spread).toBe(-3.5)
    expect(spreadLineAfter?.spreadFavouriteId).toBeUndefined()
  })

  it('normalizes league code PFB to NFL', () => {
    const normalized = normalizeForecasts(forecastSample, 'NFL')
    expect(normalized[0].league).toBe('NFL')
    expect(normalized[1].league).toBe('NFL')
  })

  it('handles scheduled games without scores', () => {
    const normalized = normalizeForecasts(forecastSample, 'NFL')
    const ev2 = normalized[1]
    expect(ev2.externalEventId).toBe('17119')
    expect(ev2.homeScore).toBeUndefined()
    expect(ev2.awayScore).toBeUndefined()
    expect(ev2.lines.length).toBe(3)

    // Check spread - should have raw value and favouriteId before adjustment
    const spreadLineBefore = ev2.lines.find((l) => l.market === 'pointspread')
    expect(spreadLineBefore?.spread).toBe(-3.5) // Raw value
    expect(spreadLineBefore?.spreadFavouriteId).toBe('667') // CHI team ID

    // Now adjust the spread sign - CHI (home) is favorite, so spread should remain negative
    const teamIdToCode = new Map([['667', 'CHI']]) // CHI team ID maps to CHI code (home team)
    const adjusted = adjustSpreadSigns(normalized, teamIdToCode)
    const spreadLineAfter = adjusted[1].lines.find((l) => l.market === 'pointspread')
    expect(spreadLineAfter?.spread).toBe(-3.5) // Same as raw since favourite is home
    expect(spreadLineAfter?.spreadFavouriteId).toBeUndefined()
  })

  it('returns empty array for missing forecasts', () => {
    const emptyResponse = { success: '1' }
    const normalized = normalizeForecasts(emptyResponse, 'NFL')
    expect(normalized).toEqual([])
  })

  it('handles partial forecast data', () => {
    const partialForecast = {
      forecasts: {
        forecast_999: {
          visitor: 'Team A',
          home: 'Team B',
          gamedate: '2025-10-20 15:00:00',
          forecast: {
            moneyline: {
              vismoneyline: '+100',
              homemoneyline: '-110',
            },
            // No spread or overunder
          },
        },
      },
    }

    const normalized = normalizeForecasts(partialForecast, 'NFL')
    expect(normalized.length).toBe(1)
    expect(normalized[0].lines.length).toBe(1)
    expect(normalized[0].lines[0].market).toBe('moneyline')
  })

  it('uses team code mapping to normalize team names when provided', () => {
    // Create a team code to name mapping
    const teamCodeToName = new Map([
      ['NOS', 'New Orleans Saints'],
      ['CHI', 'Chicago Bears'],
      ['LAR', 'Los Angeles Rams'],
      ['JAX', 'Jacksonville Jaguars'],
    ])

    const normalized = normalizeForecasts(forecastSample, 'NFL', teamCodeToName)
    expect(normalized.length).toBe(2)

    // Check that abbreviated names are replaced with full names from mapping
    const ev1 = normalized[0]
    expect(ev1.homeTeam).toBe('Jacksonville Jaguars')
    expect(ev1.awayTeam).toBe('Los Angeles Rams')

    const ev2 = normalized[1]
    // "New Orleans" should become "New Orleans Saints"
    expect(ev2.awayTeam).toBe('New Orleans Saints')
    // "Chicago" should become "Chicago Bears"
    expect(ev2.homeTeam).toBe('Chicago Bears')
  })

  it('falls back to API names when team code mapping is not provided', () => {
    const normalized = normalizeForecasts(forecastSample, 'NFL')
    expect(normalized.length).toBe(2)

    // Without mapping, should use names from API (which may be abbreviated)
    const ev2 = normalized[1]
    expect(ev2.awayTeam).toBe('New Orleans') // Abbreviated name from API
    expect(ev2.homeTeam).toBe('Chicago') // Abbreviated name from API
  })

  it('falls back to API names when team code is not in mapping', () => {
    // Mapping with only some teams
    const partialMapping = new Map([
      ['LAR', 'Los Angeles Rams'],
      ['JAX', 'Jacksonville Jaguars'],
    ])

    const normalized = normalizeForecasts(forecastSample, 'NFL', partialMapping)
    expect(normalized.length).toBe(2)

    const ev1 = normalized[0]
    expect(ev1.homeTeam).toBe('Jacksonville Jaguars') // Found in mapping
    expect(ev1.awayTeam).toBe('Los Angeles Rams') // Found in mapping

    const ev2 = normalized[1]
    expect(ev2.awayTeam).toBe('New Orleans') // Not in mapping, uses API name
    expect(ev2.homeTeam).toBe('Chicago') // Not in mapping, uses API name
  })

  it('full pipeline: normalizeForecasts + adjustSpreadSigns', () => {
    // Test the complete flow with team mappings
    const teamCodeToName = new Map([
      ['LAR', 'Los Angeles Rams'],
      ['JAX', 'Jacksonville Jaguars'],
      ['NOS', 'New Orleans Saints'],
      ['CHI', 'Chicago Bears'],
    ])

    const teamIdToCode = new Map([
      ['2022531', 'LAR'], // LAR team ID (away in game 1)
      ['667', 'CHI'], // CHI team ID (home in game 2)
    ])

    // Step 1: Normalize
    const normalized = normalizeForecasts(forecastSample, 'NFL', teamCodeToName)
    expect(normalized.length).toBe(2)

    // Step 2: Adjust spread signs
    const adjusted = adjustSpreadSigns(normalized, teamIdToCode)

    // Game 1: LAR (away) is favorite with -3.5 spread
    // After adjustment, home team (JAX) should get +3.5
    const game1 = adjusted[0]
    expect(game1.homeTeam).toBe('Jacksonville Jaguars')
    expect(game1.awayTeam).toBe('Los Angeles Rams')
    const game1Spread = game1.lines.find((l) => l.market === 'pointspread')
    expect(game1Spread?.spread).toBe(3.5) // Negated because favourite is away
    expect(game1Spread?.spreadFavouriteId).toBeUndefined()

    // Game 2: CHI (home) is favorite with -3.5 spread
    // After adjustment, home team (CHI) should keep -3.5
    const game2 = adjusted[1]
    expect(game2.homeTeam).toBe('Chicago Bears')
    expect(game2.awayTeam).toBe('New Orleans Saints')
    const game2Spread = game2.lines.find((l) => l.market === 'pointspread')
    expect(game2Spread?.spread).toBe(-3.5) // Same because favourite is home
    expect(game2Spread?.spreadFavouriteId).toBeUndefined()
  })
})
