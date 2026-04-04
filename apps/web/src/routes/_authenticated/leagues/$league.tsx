import { UpcomingGamesPageLayout } from '@/components/games/UpcomingGamesPageLayout'
import GamesGrid from '@/components/games/GamesGrid'
import { useUpcomingGames } from '@/hooks/useGames'
import { createFileRoute, useParams } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/leagues/$league')({
  component: RouteComponent,
})

function RouteComponent() {
  const params = useParams({ from: '/_authenticated/leagues/$league' })
  const { data: games, isLoading } = useUpcomingGames(params.league)

  const leagueTitle = `${params.league.toUpperCase()} Games`

  return (
    <UpcomingGamesPageLayout title={leagueTitle}>
      <GamesGrid games={games ?? []} isLoading={isLoading} />
    </UpcomingGamesPageLayout>
  )
}
