import { LayoutGrid, Table2 } from 'lucide-react'
import UpcomingGamesTable from '@/components/games/UpcomingGamesTable'
import GamesGrid from '@/components/games/GamesGrid'
import { DailyPredictionStats } from '@/components/DailyPredictionStats'
import { Button } from '@/components/ui/button'
import { useUpcomingGames } from '@/hooks/useGames'
import useUIStore from '@/store/ui'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/_home/')({
  component: Index,
})

function Index() {
  const viewMode = useUIStore((s) => s.viewMode)
  const toggleViewMode = useUIStore((s) => s.toggleViewMode)
  const { data: games, isLoading } = useUpcomingGames()

  return (
    <div className='max-w-7xl flex flex-col mx-auto px-4 sm:px-6 lg:px-8 py-4 gap-6'>
      <DailyPredictionStats />

      {/* View Toggle */}
      <div className='flex items-center justify-between'>
        <h2 className='text-2xl font-semibold'>Upcoming Games</h2>
        <Button variant='outline' size='sm' onClick={toggleViewMode} className='gap-2'>
          {viewMode === 'cards' ? (
            <>
              <Table2 className='h-4 w-4' />
              <span className='hidden sm:inline'>Table View</span>
            </>
          ) : (
            <>
              <LayoutGrid className='h-4 w-4' />
              <span className='hidden sm:inline'>Card View</span>
            </>
          )}
        </Button>
      </div>

      {/* Conditional Rendering Based on View Mode */}
      {viewMode === 'cards' ? <GamesGrid games={games ?? []} isLoading={isLoading} /> : <UpcomingGamesTable />}
    </div>
  )
}
