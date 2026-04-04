import { UpcomingGamesPageLayout } from '@/components/games/UpcomingGamesPageLayout'
import GamesGrid from '@/components/games/GamesGrid'
import { useUpcomingGames } from '@/hooks/useGames'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/_home/')({
  component: Index,
})

function Index() {
  const { data: games, isLoading } = useUpcomingGames()

  return (
    <UpcomingGamesPageLayout title='Upcoming Games'>
      <GamesGrid games={games ?? []} isLoading={isLoading} />
    </UpcomingGamesPageLayout>
  )
}
