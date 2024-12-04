'use client'

import React from 'react'
import useSWR from 'swr'
import { useParams } from 'next/navigation'
import { useAppStore } from '@/app/store'
import { fetcher } from '@/app/lib/fetcher'
import PulseError from '@/app/components/pulse-error'
import { Game } from '@/types/game'

import { GAMES_QUERY } from '../page'
import GameCard from '../../components/game-card'
import Loading from './loading'
import OddsTabs from './components/odds-tabs'

export default function Page() {
  const { leagueId, gameId } = useParams() as { leagueId: string; gameId: string }
  const sportsbook = useAppStore((state) => state.sportsbook)

  const { data, error, isLoading, mutate } = useSWR<{ games: Game[] }>(
    sportsbook ? [GAMES_QUERY, { leagueId, sportsbookId: sportsbook.id, gameId }] : null,
    ([query, variables]) => fetcher(query, variables as Record<string, any>)
  )

  if (!sportsbook) return <PulseError message='Please select a sportsbook.' />
  if (isLoading) return <Loading />
  if (error) return <PulseError message='Failed to load game data. Please try again.' onRetry={() => mutate()} />
  if (!data?.games.length)
    return <PulseError message='Game not found. Please check try again or check back later.' onRetry={() => mutate()} />

  const game = data.games[0]

  return (
    <div className='flex flex-1 flex-col gap-4 p-4 overflow-x-auto'>
      <GameCard key={data.games[0].id} game={data.games[0]} sportsbookID={sportsbook?.id} />

      <OddsTabs game={game} homeTeam={game.teams.home} awayTeam={game.teams.away} />
    </div>
  )
}
