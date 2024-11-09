'use client'

import React from 'react'
import useSWR from 'swr'
import { Separator } from '@radix-ui/react-separator'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '../components/ui/breadcrumb'
import { SidebarTrigger } from '../components/ui/sidebar'
import { useParams } from 'next/navigation'
import { SUPPORTED_LEAGUES } from '../constants'
import { useAppStore } from '../store'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card'
import { toast } from 'sonner'
import { PulseError } from '@/types/error'

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const { error } = await res.json()

    console.log(error)

    throw new PulseError(error.message ?? 'An error occurred', error.description ?? 'Please try again.', res.status)
  }
  return res.json()
}

export default function Page() {
  const { league: leagueID } = useParams() as { league: string }

  const league = useAppStore((state) => state.league) ?? SUPPORTED_LEAGUES.find((l) => l.id === leagueID)
  const sportsbook = useAppStore((state) => state.sportsbook)

  const {
    data: odds,
    error,
    isLoading,
    mutate,
  } = useSWR(
    sportsbook ? `${process.env.BACKEND_URL}/odds?sportsbook_id=${sportsbook.id}&league_id=${leagueID}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
        if (retryCount >= 1) return
        if (error.status === 404) return
        setTimeout(() => revalidate({ retryCount }), 5000)
      },
    }
  )

  if (isLoading) return <div className='mx-auto w-full h-full flex justify-center items-center'>Loading...</div>

  if (error) {
    toast.error(error.message, {
      description: error.description,
      duration: 10000,
      closeButton: true,
      action: { label: 'Retry', onClick: () => mutate() },
    })

    return <div className='mx-auto w-full h-full flex justify-center items-center'>Failed to load</div>
  }

  return (
    <div className='mx-auto w-full h-full'>
      <header className='flex h-16 shrink-0 items-center gap-2 border-b px-4'>
        <SidebarTrigger className='-ml-1' />
        <Separator orientation='vertical' className='mr-2 h-4' />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className='hidden md:block'>
              <BreadcrumbLink href='/'>Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className='hidden md:block' />
            <BreadcrumbItem>
              <BreadcrumbPage>{league?.league}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
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
    </div>
  )
}
