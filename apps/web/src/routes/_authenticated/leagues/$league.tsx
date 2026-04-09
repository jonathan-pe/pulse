import { UpcomingGamesPageLayout } from '@/components/games/UpcomingGamesPageLayout'
import GamesGrid from '@/components/games/GamesGrid'
import { useUpcomingGames } from '@/hooks/useGames'
import { formatRelativeTime, getLatestOddsUpdatedAt } from '@/lib/odds-freshness'
import { createFileRoute, useParams } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/leagues/$league')({
  component: RouteComponent,
})

function RouteComponent() {
  const params = useParams({ from: '/_authenticated/leagues/$league' })
  const { data: games, isLoading } = useUpcomingGames(params.league)
  const latestOddsUpdate = getLatestOddsUpdatedAt(games ?? [])
  const oddsSubtitle = latestOddsUpdate ? `Odds updated ${formatRelativeTime(latestOddsUpdate)}` : undefined

  const leagueTitle = `${params.league.toUpperCase()} Games`

  return (
    <UpcomingGamesPageLayout title={leagueTitle} subtitle={oddsSubtitle}>
      <GamesGrid
        games={games ?? []}
        isLoading={isLoading}
      />
    </UpcomingGamesPageLayout>
  )
}
