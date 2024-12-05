'use client'

import React from 'react'
import { Separator } from '@/app/components/ui/separator'
import { SidebarTrigger } from '@/app/components/ui/sidebar'
import { toast } from 'sonner'
import { SWRConfig, mutate } from 'swr'
import Cart from '../components/cart'
import Breadcrumbs from './components/breadcrumbs'

export default function Sportsbook({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className='mx-auto size-full'>
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
        <header className='sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-background px-4'>
          <div className='flex items-center'>
            <SidebarTrigger className='-ml-1' />
            <Separator orientation='vertical' className='mr-2 h-4' />
            <Breadcrumbs />
          </div>
          <Cart />
        </header>
        {children}
      </SWRConfig>
    </div>
  )
}
