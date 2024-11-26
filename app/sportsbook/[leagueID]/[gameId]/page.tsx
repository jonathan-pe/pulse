'use client'

import React from 'react'
import useSWR from 'swr'
import { useParams } from 'next/navigation'
import { useAppStore } from '@/app/store'
import { fetcher } from '@/utils/clientFetcher'
import PulseError from '@/app/components/pulse-error'
import { Game } from '@/types/game'

import { GAMES_QUERY } from '../page'
import GameCard from '../../components/game-card'

export default function Page() {
  const { leagueId, gameId } = useParams() as { leagueId: string; gameId: string }
  const sportsbook = useAppStore((state) => state.sportsbook)

  const { data, error, isLoading, mutate } = useSWR<{ games: Game[] }>(
    sportsbook ? [GAMES_QUERY, { leagueId, sportsbookId: sportsbook.id, gameId }] : null,
    ([query, variables]) => fetcher(query, variables as Record<string, any>)
  )

  if (!sportsbook) return <PulseError message='Please select a sportsbook.' />
  // if (isLoading) return <Loading />
  if (error) return <PulseError message="Can't load league data. Please try again." onRetry={() => mutate()} />
  if (!data?.games.length)
    return <PulseError message='No games found. Please check back later.' onRetry={() => mutate()} />

  return (
    <div className='flex flex-1 flex-col gap-4 p-4'>
      <h2 className='text-2xl font-bold'>Available Games</h2>
      <div className='flex flex-col gap-4'>
        <GameCard key={data.games[0].id} game={data.games[0]} sportsbookID={sportsbook?.id} />
      </div>
    </div>
  )
}
