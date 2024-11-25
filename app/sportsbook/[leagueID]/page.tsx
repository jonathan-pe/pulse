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
  const { leagueId } = useParams() as { leagueId: string }
  const sportsbook = useAppStore((state) => state.sportsbook)

  const {
    data: { games } = { games: [] },
    error,
    isLoading,
    mutate,
  } = useSWR<{ games: Game[] }>(
    sportsbook
      ? `{
            games(leagueId: "${leagueId}", sportsbookId: "${sportsbook.id}") {
              id
              sport
              league
              teams {
                home {
                  id
                  name
                  abbreviation
                }
                away {
                  id
                  name
                  abbreviation
                }
              }
              start
              status
              live
              tournament
              sportsbooks {
                id
                name
                odds {
                  id
                  group
                  market
                  name
                  main
                  price
                  points
                  selection
                  link
                  sgp
                  grade
                }
              }
            }
        }
    `
      : null,
    fetcher
  )

  if (!sportsbook) return <PulseError message='Please select a sportsbook.' />
  if (isLoading) return <Loading />
  if (error) return <PulseError message="Can't load league data. Please try again." onRetry={() => mutate()} />
  if (!games.length) return <PulseError message='No games found. Please check back later.' onRetry={() => mutate()} />

  games.sort((a: Game, b: Game) => {
    return new Date(a.start).getTime() - new Date(b.start).getTime()
  })

  return (
    <div className='flex flex-1 flex-col gap-4 p-4'>
      <h2 className='text-2xl font-bold'>Available Games</h2>
      <div className='flex flex-col gap-4'>
        {games.map((game: Game) => (
          <GameCard key={game.id} game={game} sportsbookID={sportsbook?.id} />
        ))}
      </div>
    </div>
  )
}
