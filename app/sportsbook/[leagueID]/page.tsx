'use client'

import React from 'react'
import useSWR from 'swr'
import { useParams } from 'next/navigation'
import { useAppStore } from '@/app/store'
import { fetcher } from '@/utils/clientFetcher'
import Loading from './loading'
import PulseError from '@/app/components/pulse-error'
import { Game } from '@/types/game'
import GameCard from '../components/game-card'

export default function Page() {
  const { leagueID } = useParams() as { leagueID: string }
  const sportsbook = useAppStore((state) => state.sportsbook)

  const {
    data: { games } = { games: [] },
    error,
    isLoading,
    mutate,
  } = useSWR(
    sportsbook ? `${process.env.BACKEND_URL}/odds?sportsbook_id=${sportsbook.id}&league_id=${leagueID}` : null,
    (url) => fetcher(url, {})
  )

  if (isLoading) return <Loading />
  if (error) return <PulseError message="Can't load league data. Please try again." onRetry={() => mutate()} />
  if (!games.length) return <PulseError message='No games found. Please check back later.' onRetry={() => mutate()} />

  return (
    <div className='flex flex-1 flex-col gap-4 p-4'>
      <h2 className='text-2xl font-bold'>Today&apos;s Games</h2>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {games.map((game: Game) => (
          <GameCard key={game.id} game={game} sportsbookID={sportsbook?.id} />
        ))}
      </div>
    </div>
  )
}
