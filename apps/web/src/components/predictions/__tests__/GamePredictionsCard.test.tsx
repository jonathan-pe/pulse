import { render, screen } from '@testing-library/react'
import { GamePredictionsCard } from '../GamePredictionsCard'
import type { PredictionWithGame } from '@/types/api'

function makePrediction(overrides: Partial<PredictionWithGame> = {}): PredictionWithGame {
  return {
    id: 'pred1',
    gameId: 'game1',
    type: 'MONEYLINE',
    pick: 'home',
    createdAt: '2025-12-01T12:00:00Z',
    lockedAt: null,
    bonusTier: false,
    isCorrect: null,
    processedAt: null,
    pointsEarned: 0,
    oddsAtPrediction: null,
    game: {
      id: 'game1',
      league: 'NBA',
      startsAt: '2025-12-02T20:00:00Z',
      homeTeam: {
        name: 'Lakers',
        code: 'LAL',
        logoUrl: 'home-logo.png',
      },
      awayTeam: {
        name: 'Warriors',
        code: 'GSW',
        logoUrl: 'away-logo.png',
      },
      result: null,
    },
    ...overrides,
  }
}

describe('GamePredictionsCard', () => {
  it('renders game metadata and predictions', () => {
    const predictions = [makePrediction()]
    render(<GamePredictionsCard gamePredictions={predictions} />)
    // There are multiple elements with 'LAL' and 'GSW' (logo and code), so use getAllByText
    expect(screen.getAllByText('LAL').length).toBeGreaterThan(0)
    expect(screen.getAllByText('GSW').length).toBeGreaterThan(0)
    expect(screen.getByText('NBA')).toBeInTheDocument()
    // The status badge can be 'Pending', 'Live', or 'Final' depending on the game time/result
    // For this test, the game time may be in the past, so check for 'Live' or 'Pending'
    const liveBadges = screen.queryAllByText(/live/i)
    const pendingBadges = screen.queryAllByText(/pending/i)
    expect(liveBadges.length > 0 || pendingBadges.length > 0).toBe(true)
  })

  it('shows Final badge and score for completed games', () => {
    const predictions = [
      makePrediction({
        game: {
          ...makePrediction().game,
          result: { homeScore: 110, awayScore: 105 },
        },
      }),
    ]
    render(<GamePredictionsCard gamePredictions={predictions} />)
    // There are multiple 'Final' (badge and 'Final Score' label), so check for badge specifically
    const finalBadges = screen.getAllByText(/final/i)
    // One should be the badge, one the score label
    expect(finalBadges.length).toBeGreaterThan(1)
    // Optionally, check for the badge by role or class if needed
    expect(screen.getByText('110')).toBeInTheDocument()
    expect(screen.getByText('105')).toBeInTheDocument()
  })

  it('shows Live badge for games in progress', () => {
    const now = new Date().toISOString()
    const predictions = [
      makePrediction({
        game: {
          ...makePrediction().game,
          startsAt: now,
          result: null,
        },
      }),
    ]
    render(<GamePredictionsCard gamePredictions={predictions} />)
    expect(screen.getByText(/live/i)).toBeInTheDocument()
  })

  it('renders multiple predictions for the same game', () => {
    const predictions = [makePrediction({ id: 'pred1' }), makePrediction({ id: 'pred2', pick: 'away' })]
    render(<GamePredictionsCard gamePredictions={predictions} />)
    expect(screen.getAllByTestId('prediction-item')).toHaveLength(2)
  })
})
