'use client'

import React from 'react'
import { Separator } from '@radix-ui/react-separator'
import { AppSidebar } from '../components/sidebar'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '../components/ui/breadcrumb'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '../components/ui/sidebar'
import { useAppStore } from '../store'
import { SUPPORTED_LEAGUES } from '../constants'
import { useParams } from 'next/navigation'

export default function Page() {
  const { league: leagueID } = useParams() as { league: string }

  const league = useAppStore((state) => state.league) ?? SUPPORTED_LEAGUES.find((l) => l.id === leagueID)

  return (
    <div className='mx-auto'>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
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
            <div className='grid auto-rows-min gap-4 md:grid-cols-3'>
              <div className='aspect-video rounded-xl bg-muted' />
              <div className='aspect-video rounded-xl bg-muted' />
              <div className='aspect-video rounded-xl bg-muted' />
            </div>
            <div className='min-h-[100vh] flex-1 rounded-xl bg-muted md:min-h-min' />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
