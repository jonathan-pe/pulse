'use client'

import React from 'react'
import { Separator } from '@/app/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/app/components/ui/sidebar'
import { AppSidebar } from './components/sidebar'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '../components/ui/breadcrumb'
import { useAppStore } from '../store'
import { toast } from 'sonner'
import { SWRConfig, mutate } from 'swr'
import { useParams, useRouter, usePathname } from 'next/navigation'
import { SUPPORTED_LEAGUES } from '../constants'
import Cart from '../components/cart'
import Breadcrumbs from './components/breadcrumbs'

export default function Sportsbook({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { leagueId } = useParams() as { leagueId: string }
  const router = useRouter()
  const pathname = usePathname()

  const league = useAppStore((state) => state.league) ?? SUPPORTED_LEAGUES.find((l) => l.id === leagueId)
  const setLeague = useAppStore((state) => state.setLeague)

  return (
    <div className='mx-auto w-full h-full'>
      <SidebarProvider>
        <SWRConfig
          value={{
            onError: (error, key) => {
              toast.error(error.message, {
                description: error.description,
                duration: 10000,
                closeButton: true,
                action: {
                  label: 'Retry',
                  onClick: () => mutate(key),
                },
              })
            },
            revalidateOnFocus: false,
            onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
              if (retryCount >= 1) return
              if (error.status === 404) return

              setTimeout(() => revalidate({ retryCount }), 10000)
            },
          }}
        >
          <AppSidebar />
          <SidebarInset>
            <header className='sticky top-0 bg-background flex h-16 shrink-0 items-center gap-2 border-b px-4 justify-between'>
              <div className='flex items-center'>
                <SidebarTrigger className='-ml-1' />
                <Separator orientation='vertical' className='mr-2 h-4' />
                <Breadcrumbs />
              </div>
              <Cart />
            </header>
            {children}
          </SidebarInset>
        </SWRConfig>
      </SidebarProvider>
    </div>
  )
}
