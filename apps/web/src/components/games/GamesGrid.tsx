import React from 'react'
import type { GameWithUnifiedOdds } from '@pulse/types'
import GameCard from './GameCard'
import { Skeleton } from '@/components/ui/skeleton'

interface GamesGridProps {
  games: GameWithUnifiedOdds[]
  isLoading?: boolean
}

const GamesGrid: React.FC<GamesGridProps> = ({ games, isLoading }) => {
  if (isLoading) {
    return (
      <div className='grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3'>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className='space-y-3 rounded-lg border p-4'>
            <div className='flex items-center justify-between'>
              <Skeleton className='h-5 w-16' />
              <Skeleton className='h-5 w-24' />
            </div>
            <div className='space-y-2'>
              <div className='flex items-center gap-3'>
                <Skeleton className='h-10 w-10 rounded-full' />
                <Skeleton className='h-6 flex-1' />
              </div>
              <div className='flex items-center gap-3'>
                <Skeleton className='h-10 w-10 rounded-full' />
                <Skeleton className='h-6 flex-1' />
              </div>
            </div>
            <Skeleton className='h-20 w-full' />
          </div>
        ))}
      </div>
    )
  }

  if (games.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center'>
        <div className='text-muted-foreground'>
          <p className='text-sm font-medium'>No games available</p>
          <p className='mt-1 text-xs'>Check back later for upcoming games</p>
        </div>
      </div>
    )
  }

  return (
    <div className='grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3'>
      {games.map((game) => (
        <GameCard key={game.id} game={game} />
      ))}
    </div>
  )
}

export default GamesGrid
