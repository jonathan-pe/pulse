'use client'

import React from 'react'
import useSWR from 'swr'
import { useParams } from 'next/navigation'
import { useAppStore } from '@/app/store'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/app/components/ui/card'
import { fetcher } from '@/app/lib/utils'
import Loading from './loading'

export default function Page() {
  const { leagueID } = useParams() as { leagueID: string }
  const sportsbook = useAppStore((state) => state.sportsbook)

  const {
    data: odds,
    error,
    isLoading,
  } = useSWR(
    sportsbook ? `${process.env.BACKEND_URL}/odds?sportsbook_id=${sportsbook.id}&league_id=${leagueID}` : null,
    fetcher
  )

  if (isLoading)
    return (
      <div className='mx-auto w-full h-full flex justify-center items-center'>
        <Loading />
      </div>
    )
  if (error) {
    return (
      <div className='mx-auto w-full h-full flex justify-center items-center'>
        {/* Failed to load odds. Please try again. */}
        <Loading />
      </div>
    )
  }

  return (
    <div className='flex flex-1 flex-col gap-4 p-4'>
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Card Content</p>
        </CardContent>
        <CardFooter>
          <p>Card Footer</p>
        </CardFooter>
      </Card>
    </div>
  )
}
