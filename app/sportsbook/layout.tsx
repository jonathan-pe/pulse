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

export default function Sportsbook({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const league = useAppStore((state) => state.league)
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
            <header className='flex h-16 shrink-0 items-center gap-2 border-b px-4'>
              <SidebarTrigger className='-ml-1' />
              <Separator orientation='vertical' className='mr-2 h-4' />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href='/' onClick={() => setLeague(null)}>
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
            </header>
            {children}
          </SidebarInset>
        </SWRConfig>
      </SidebarProvider>
    </div>
  )
}
