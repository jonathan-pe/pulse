import { UpcomingGamesPageLayout } from '@/components/games/UpcomingGamesPageLayout'
import GamesGrid from '@/components/games/GamesGrid'
import { useUpcomingGames } from '@/hooks/useGames'
import { formatRelativeTime, getLatestOddsUpdatedAt } from '@/lib/odds-freshness'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/_home/')({
  component: Index,
})

function Index() {
  const { data: games, isLoading } = useUpcomingGames()
  const latestOddsUpdate = getLatestOddsUpdatedAt(games ?? [])
  const oddsSubtitle = latestOddsUpdate ? `Odds updated ${formatRelativeTime(latestOddsUpdate)}` : undefined

  return (
    <UpcomingGamesPageLayout title='Upcoming Games' subtitle={oddsSubtitle}>
      <GamesGrid
        games={games ?? []}
        isLoading={isLoading}
      />
    </UpcomingGamesPageLayout>
  )
}
