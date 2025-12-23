import { render, screen } from '@testing-library/react'
import { LeaderboardTable } from '../LeaderboardTable'
import type { LeaderboardEntry, LeaderboardPeriod } from '@pulse/types'
import { vi } from 'vitest'

// Mock Clerk useUser to avoid requiring ClerkProvider in tests
vi.mock('@clerk/clerk-react', () => ({
  useUser: () => ({ user: null }),
}))

const sampleEntries: LeaderboardEntry[] = [
  {
    userId: 'u1',
    points: 1200,
    rank: 1,
    username: 'Alpha',
    displayName: null,
    imageUrl: null,
    rankChange: 2,
  },
  {
    userId: 'u2',
    points: 980,
    rank: 2,
    username: 'Bravo',
    displayName: null,
    imageUrl: null,
    rankChange: -1,
  },
]

describe('LeaderboardTable', () => {
  const renderTable = (
    opts: { leaderboard?: LeaderboardEntry[]; isLoading?: boolean; period?: LeaderboardPeriod } = {}
  ) => {
    const { leaderboard = sampleEntries, isLoading = false, period = 'daily' } = opts
    render(<LeaderboardTable leaderboard={leaderboard} isLoading={isLoading} period={period} />)
  }

  it('shows loading state', () => {
    renderTable({ isLoading: true })
    expect(screen.getByText(/loading leaderboard/i)).toBeInTheDocument()
  })

  it('shows empty state', () => {
    renderTable({ leaderboard: [] })
    expect(screen.getByText(/no rankings available yet/i)).toBeInTheDocument()
  })

  it('renders entries with ranks and points', () => {
    renderTable()
    expect(screen.getByText(/today's leaders/i)).toBeInTheDocument()
    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Bravo')).toBeInTheDocument()
    expect(screen.getByText('1,200')).toBeInTheDocument()
    expect(screen.getByText('980')).toBeInTheDocument()
  })

  it('renders weekly headers and rank change badges', () => {
    renderTable({ period: 'weekly' })
    expect(screen.getByText(/this week's leaders/i)).toBeInTheDocument()
    // Rank change badges exist (text values 2 and 1)
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('renders all-time header', () => {
    renderTable({ period: 'alltime' })
    expect(screen.getByText(/all-time leaders/i)).toBeInTheDocument()
  })

  it('shows reset time in local timezone for daily period', () => {
    renderTable({ period: 'daily' })
    // Should show "Resets daily at" with a time
    expect(screen.getByText(/resets daily at/i)).toBeInTheDocument()
    // Should NOT show UTC reference
    expect(screen.queryByText(/UTC/)).not.toBeInTheDocument()
  })

  it('shows reset time in local timezone for weekly period', () => {
    renderTable({ period: 'weekly' })
    // Should show "Resets" with day and time
    expect(screen.getByText(/resets/i)).toBeInTheDocument()
    // Should NOT show UTC reference
    expect(screen.queryByText(/UTC/)).not.toBeInTheDocument()
  })

  it('shows all-time description without reset time', () => {
    renderTable({ period: 'alltime' })
    expect(screen.getByText(/total points earned all-time/i)).toBeInTheDocument()
    expect(screen.queryByText(/resets/i)).not.toBeInTheDocument()
  })

  describe('Display name logic', () => {
    it('shows displayName when present (no @ prefix)', () => {
      const entriesWithDisplayNames: LeaderboardEntry[] = [
        {
          userId: 'u1',
          points: 1200,
          rank: 1,
          username: 'alpha_user',
          displayName: 'Alpha Champion',
          imageUrl: null,
          rankChange: null,
        },
        {
          userId: 'u2',
          points: 980,
          rank: 2,
          username: 'bravo_user',
          displayName: 'Bravo Star',
          imageUrl: null,
          rankChange: null,
        },
      ]

      renderTable({ leaderboard: entriesWithDisplayNames })

      // Should show displayName, not username
      expect(screen.getByText('Alpha Champion')).toBeInTheDocument()
      expect(screen.getByText('Bravo Star')).toBeInTheDocument()

      // Should NOT show username or @ prefix
      expect(screen.queryByText('alpha_user')).not.toBeInTheDocument()
      expect(screen.queryByText('@alpha_user')).not.toBeInTheDocument()
      expect(screen.queryByText('bravo_user')).not.toBeInTheDocument()
      expect(screen.queryByText('@bravo_user')).not.toBeInTheDocument()
    })

    it('shows username when displayName is null (no @ prefix)', () => {
      const entriesWithoutDisplayNames: LeaderboardEntry[] = [
        {
          userId: 'u1',
          points: 1200,
          rank: 1,
          username: 'player_one',
          displayName: null,
          imageUrl: null,
          rankChange: null,
        },
        {
          userId: 'u2',
          points: 980,
          rank: 2,
          username: 'player_two',
          displayName: null,
          imageUrl: null,
          rankChange: null,
        },
      ]

      renderTable({ leaderboard: entriesWithoutDisplayNames })

      // Should show username without @ prefix
      expect(screen.getByText('player_one')).toBeInTheDocument()
      expect(screen.getByText('player_two')).toBeInTheDocument()

      // Should NOT show @ prefix
      expect(screen.queryByText('@player_one')).not.toBeInTheDocument()
      expect(screen.queryByText('@player_two')).not.toBeInTheDocument()
    })

    it('shows "Anonymous" when both displayName and username are null', () => {
      const anonymousEntries: LeaderboardEntry[] = [
        {
          userId: 'u1',
          points: 100,
          rank: 1,
          username: null,
          displayName: null,
          imageUrl: null,
          rankChange: null,
        },
      ]

      renderTable({ leaderboard: anonymousEntries })

      expect(screen.getByText('Anonymous')).toBeInTheDocument()
    })

    it('prioritizes displayName over username when both are present', () => {
      const mixedEntries: LeaderboardEntry[] = [
        {
          userId: 'u1',
          points: 1200,
          rank: 1,
          username: 'john_doe',
          displayName: 'John Doe',
          imageUrl: null,
          rankChange: null,
        },
        {
          userId: 'u2',
          points: 980,
          rank: 2,
          username: 'jane_smith',
          displayName: null,
          imageUrl: null,
          rankChange: null,
        },
        {
          userId: 'u3',
          points: 750,
          rank: 3,
          username: 'bob_jones',
          displayName: 'Bobby J',
          imageUrl: null,
          rankChange: null,
        },
      ]

      renderTable({ leaderboard: mixedEntries })

      // User 1: has displayName, should show displayName
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.queryByText('john_doe')).not.toBeInTheDocument()

      // User 2: no displayName, should show username without @
      expect(screen.getByText('jane_smith')).toBeInTheDocument()
      expect(screen.queryByText('@jane_smith')).not.toBeInTheDocument()

      // User 3: has displayName, should show displayName
      expect(screen.getByText('Bobby J')).toBeInTheDocument()
      expect(screen.queryByText('bob_jones')).not.toBeInTheDocument()
    })

    it('never shows @ prefix in any scenario', () => {
      const testEntries: LeaderboardEntry[] = [
        {
          userId: 'u1',
          points: 1000,
          rank: 1,
          username: 'user_one',
          displayName: 'Display One',
          imageUrl: null,
          rankChange: null,
        },
        {
          userId: 'u2',
          points: 900,
          rank: 2,
          username: 'user_two',
          displayName: null,
          imageUrl: null,
          rankChange: null,
        },
      ]

      renderTable({ leaderboard: testEntries })

      // Verify no @ prefix appears with usernames
      expect(screen.queryByText('@user_one')).not.toBeInTheDocument()
      expect(screen.queryByText('@user_two')).not.toBeInTheDocument()

      // Verify correct text is shown
      expect(screen.getByText('Display One')).toBeInTheDocument()
      expect(screen.getByText('user_two')).toBeInTheDocument()
    })
  })
})
