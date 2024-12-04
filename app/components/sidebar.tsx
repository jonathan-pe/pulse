'use client'

import * as React from 'react'
import { ChevronDown, ChevronUp, User2 } from 'lucide-react'
import { redirect, useRouter } from 'next/navigation'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
} from '@/app/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu'
import SportsbookComboBox from '../sportsbook/components/sportsbook-combobox'
import { SUPPORTED_LEAGUES, SUPPORTED_SPORTS } from '@/app/constants'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/app/components/ui/collapsible'
import { useAppStore } from '@/app/store'
import { Label } from '@/app/components/ui/label'
import { Switch } from '@/app/components/ui/switch'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  const setLeague = useAppStore((state) => state.setLeague)
  const { data, status } = useSession()

  if (status !== 'authenticated') return redirect('/login')

  const { user } = data

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SportsbookComboBox />
      </SidebarHeader>
      <SidebarContent className='px-4'>
        <SidebarMenu>
          {SUPPORTED_SPORTS.map((sport) => (
            <Collapsible className='group/collapsible' key={sport}>
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton>
                    <span className='font-semibold'>{sport}</span>
                    <ChevronDown className='ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180' />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {SUPPORTED_LEAGUES.filter((l) => l.sport === sport).map((league) => (
                      <SidebarMenuSubItem
                        key={league.id}
                        onClick={() => {
                          router.push(`/sportsbook/${league.id}`)
                          setLeague(league)
                        }}
                      >
                        <SidebarMenuButton>{league.league}</SidebarMenuButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  {user?.image ? (
                    <Image src={user.image} alt='user profile photo' width={24} height={24} className='rounded-full' />
                  ) : (
                    <User2 />
                  )}{' '}
                  {user?.name ?? user?.email}
                  <ChevronUp className='ml-auto' />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side='top' className='w-[--radix-popper-anchor-width]'>
                <DropdownMenuLabel>
                  <div className='flex items-center justify-between flex-1'>
                    <Label className='font-normal'>Dark Mode</Label>
                    <Switch
                      id='dark-mode-switch'
                      checked={theme === 'dark'}
                      onClick={(e) => e.stopPropagation()}
                      onCheckedChange={(value) => setTheme(value ? 'dark' : 'light')}
                    />
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuItem className='cursor-pointer' asChild>
                  <Link href='/profile' className='w-full'>
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut({ redirectTo: '/login' })} className='cursor-pointer' asChild>
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
