'use client'

import React from 'react'
import useSWR from 'swr'
import { useParams } from 'next/navigation'
import { useAppStore } from '@/app/store'
import { fetcher } from '@/app/lib/fetcher'
import Loading from './loading'
import PulseError from '@/app/components/pulse-error'
import { Game } from '@/types/game'
import GameCard from '../components/game-card'
import { gql } from 'graphql-request'
import { GameFragment } from '@/app/lib/fragments'

export const GAMES_QUERY = gql`
  ${GameFragment}
  query Games($leagueId: String!, $sportsbookId: String!, $gameId: String) {
    games(leagueId: $leagueId, sportsbookId: $sportsbookId, gameId: $gameId) {
      ...GameFragment
    }
  }
`

export default function Page() {
  const { leagueId } = useParams() as { leagueId: string }
  const sportsbook = useAppStore((state) => state.sportsbook)

  const { data, error, isLoading, mutate } = useSWR<{ games: Game[] }>(
    sportsbook ? [GAMES_QUERY, { leagueId, sportsbookId: sportsbook.id }] : null,
    ([query, variables]) => fetcher(query, variables as Record<string, any>)
  )

  if (!sportsbook) return <PulseError message='Please select a sportsbook.' />
  if (isLoading) return <Loading />
  if (error) return <PulseError message="Can't load league data. Please try again." onRetry={() => mutate()} />
  if (!data?.games.length)
    return <PulseError message='No games found. Please check back later.' onRetry={() => mutate()} />

  const games = data.games.sort((a: Game, b: Game) => {
    return new Date(a.start).getTime() - new Date(b.start).getTime()
  })

  return (
    <div className='flex flex-1 flex-col gap-4 p-4'>
      <h2 className='text-2xl font-bold'>Available Games</h2>
      <div className='flex flex-col gap-4'>
        {games.map((game: Game) => (
          <GameCard key={game.id} game={game} sportsbookID={sportsbook?.id} selectable />
        ))}
      </div>
    </div>
  )
}
