import React from 'react'
import { LoginForm } from '@/app/components/login-form'
import { Separator } from '@/app/components/ui/separator'
import { SidebarTrigger } from '@/app/components/ui/sidebar'
import { createClient } from '@/utils/supabase/server'
import OneTapComponent from './components/google-one-tap'

export default async function Home() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // TODO: remove once we're more confident in auth
  console.log(user)

  if (!user) {
    return (
      <div className='flex h-screen w-full items-center justify-center px-4'>
        <OneTapComponent />
        <LoginForm />
      </div>
    )
  }

  return (
    <div className='mx-auto w-full h-full'>
      <header className='flex h-16 shrink-0 items-center gap-2 border-b px-4'>
        <SidebarTrigger className='-ml-1' />
        <Separator orientation='vertical' className='mr-2 h-4' />
        <span>Pulse</span>
      </header>
      <div className='flex flex-1 flex-col gap-4 p-4'>
        <div className='grid auto-rows-min gap-4 md:grid-cols-3'>
          <div className='aspect-video rounded-xl bg-muted' />
          <div className='aspect-video rounded-xl bg-muted' />
          <div className='aspect-video rounded-xl bg-muted' />
        </div>
        <div className='min-h-[100vh] flex-1 rounded-xl bg-muted md:min-h-min' />
      </div>
    </div>
  )
}
