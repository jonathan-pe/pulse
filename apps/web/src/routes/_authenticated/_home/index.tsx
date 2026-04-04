import GamesGrid from '@/components/games/GamesGrid'
import { useUpcomingGames } from '@/hooks/useGames'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/_home/')({
  component: Index,
})

function Index() {
  const { data: games, isLoading } = useUpcomingGames()

  return (
    <div className='w-full h-full overflow-y-auto'>
      <div className='container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8'>
        <div className='flex items-center justify-between mb-6'>
          <h2 className='text-2xl sm:text-3xl font-semibold'>Upcoming Games</h2>
        </div>

        <div className='mt-6'>
          <GamesGrid games={games ?? []} isLoading={isLoading} />
        </div>
      </div>
    </div>
  )
}
