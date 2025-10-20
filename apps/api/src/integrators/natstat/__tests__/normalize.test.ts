import { describe, it, expect } from 'vitest'
import { normalizeForecasts } from '../normalize'

// Sample forecast response from the new /forecasts endpoint
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
          favourite: '2022531',
          spreadcorrect: '2022541',
        },
        simulation: {
          'prediction-favourite-code': 'LAR', // Away team is favorite
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
          spread: '+3.5',
        },
        simulation: {
          'prediction-favourite-code': 'CHI', // Home team is favorite
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

    // Check spread - should be positive because away team (LAR) is favorite
    // Raw spread is -3.5, favorite is LAR (away), so home gets +3.5
    const spreadLine = ev1.lines.find((l) => l.market === 'pointspread')
    expect(spreadLine).toBeDefined()
    expect(spreadLine?.spread).toBe(3.5)

    // Check overunder
    const ouLine = ev1.lines.find((l) => l.market === 'overunder')
    expect(ouLine).toBeDefined()
    expect(ouLine?.total).toBe(44.5)
  })

  it('normalizes spread correctly when home team is favorite', () => {
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
            },
            simulation: {
              'prediction-favourite-code': 'FAV', // Home is favorite
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
    const spreadLine = normalized[0].lines.find((l) => l.market === 'pointspread')

    // Home is favorite, so spread should be negative
    expect(spreadLine?.spread).toBe(-7.5)
  })

  it('normalizes spread correctly when away team is favorite', () => {
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
            },
            simulation: {
              'prediction-favourite-code': 'FAV', // Away is favorite
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
    const spreadLine = normalized[0].lines.find((l) => l.market === 'pointspread')

    // Away is favorite, so home spread should be positive
    expect(spreadLine?.spread).toBe(7.5)
  })

  it('handles spread with positive value when away is favorite', () => {
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
            },
            simulation: {
              'prediction-favourite-code': 'STR', // Away is favorite
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
    const spreadLine = normalized[0].lines.find((l) => l.market === 'pointspread')

    // Away is favorite, so home gets positive spread
    expect(spreadLine?.spread).toBe(3.5)
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

    // Check spread - CHI (home) is favorite, so spread should be negative
    const spreadLine = ev2.lines.find((l) => l.market === 'pointspread')
    expect(spreadLine?.spread).toBe(-3.5)
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
})
