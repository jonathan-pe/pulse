import UpcomingGamesTable from '@/components/games/UpcomingGamesTable'
import { DailyPredictionStats } from '@/components/DailyPredictionStats'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/_home/')({
  component: Index,
})

function Index() {
  return (
    <div className='max-w-7xl flex flex-col mx-auto px-4 sm:px-6 lg:px-8 py-4 gap-6'>
      <DailyPredictionStats />
      <UpcomingGamesTable />
    </div>
  )
}
