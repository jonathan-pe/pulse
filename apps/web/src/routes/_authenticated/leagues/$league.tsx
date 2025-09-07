import UpcomingGamesTable from '@/routes/_authenticated/_home/-components/UpcomingGamesTable'
import { createFileRoute, useParams } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/leagues/$league')({
  component: RouteComponent,
})

function RouteComponent() {
  const params = useParams({ from: '/_authenticated/leagues/$league' })
  return (
    <div className='max-w-7xl flex flex-col mx-auto px-4 sm:px-6 lg:px-8 py-4'>
      <UpcomingGamesTable league={params.league} />
    </div>
  )
}
