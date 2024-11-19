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
import { useParams, useRouter } from 'next/navigation'
import { SUPPORTED_LEAGUES } from '../constants'
import { ShoppingCartIcon } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'

export default function Sportsbook({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { leagueID } = useParams() as { leagueID: string }
  const router = useRouter()

  const league = useAppStore((state) => state.league) ?? SUPPORTED_LEAGUES.find((l) => l.id === leagueID)
  const setLeague = useAppStore((state) => state.setLeague)
  const cart = useAppStore((state) => state.cart)

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
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink
                        className='cursor-pointer'
                        onClick={() => {
                          setLeague(null)
                          router.push('/sportsbook')
                        }}
                      >
                        Sportsbook
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    {league && (
                      <>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                          <BreadcrumbPage>{league?.league}</BreadcrumbPage>
                        </BreadcrumbItem>
                      </>
                    )}
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
              <Button variant='ghost' className='relative'>
                <ShoppingCartIcon width={24} height={24} />
                <Badge className='pointer-events-none'>{cart?.length ?? 0}</Badge>
              </Button>
            </header>
            {children}
          </SidebarInset>
        </SWRConfig>
      </SidebarProvider>
    </div>
  )
}
