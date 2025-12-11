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
    imageUrl: null,
    rankChange: 2,
  },
  {
    userId: 'u2',
    points: 980,
    rank: 2,
    username: 'Bravo',
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
})
