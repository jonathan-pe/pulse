import React from 'react'
import type { GameWithUnifiedOdds } from '@pulse/types'
import GameCard from './GameCard'
import { Skeleton } from '@/components/ui/skeleton'
import { groupGamesByLocalDay } from '@/lib/group-games-by-local-day'

interface GamesGridProps {
  games: GameWithUnifiedOdds[]
  isLoading?: boolean
  /** When true (default), group cards by local kickoff calendar day. */
  groupByDay?: boolean
}

const gamesGridLayoutClass = 'grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3'

const GamesGrid: React.FC<GamesGridProps> = ({ games, isLoading, groupByDay = true }) => {
  if (isLoading) {
    return (
      <div className={gamesGridLayoutClass}>
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

  if (!groupByDay) {
    return (
      <div className={gamesGridLayoutClass}>
        {games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    )
  }

  const dayGroups = groupGamesByLocalDay(games)

  return (
    <div className='flex flex-col gap-8 sm:gap-10'>
      {dayGroups.map(({ dateKey, label, games: dayGames }) => (
        <section key={dateKey} aria-labelledby={`games-day-${dateKey}`}>
          <h3 id={`games-day-${dateKey}`} className='text-lg font-semibold tracking-tight text-foreground mb-4'>
            {label}
          </h3>
          <div className={gamesGridLayoutClass}>
            {dayGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

export default GamesGrid
