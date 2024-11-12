'use client'

import * as React from 'react'
import { ChevronDown, ChevronUp, User2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

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
import SportsbookComboBox from './sportsbook-combobox'
import { SUPPORTED_LEAGUES, SUPPORTED_SPORTS } from '../../constants'
import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../components/ui/collapsible'
import { useAppStore } from '../../store'
import { Label } from '@/app/components/ui/label'
import { Switch } from '@/app/components/ui/switch'
import { useTheme } from 'next-themes'
import Image from 'next/image'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const supabase = createClient()
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  const setLeague = useAppStore((state) => state.setLeague)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        setUser(user)
      }
    }

    fetchUser()
  }, [supabase])

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      toast.error('Failed to log out. Please try again.')
      console.error('Error logging out:', error.message)
      return
    } else {
      setLeague(null)
      router.push('/login')
      toast.success('Successfully logged out.')
    }
  }

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
                  {user?.user_metadata?.picture ? (
                    <Image
                      src={user.user_metadata.picture}
                      alt='user profile photo'
                      width={24}
                      height={24}
                      className='rounded-full'
                    />
                  ) : (
                    <User2 />
                  )}{' '}
                  {user?.user_metadata?.display_name ??
                    user?.user_metadata?.full_name ??
                    user?.user_metadata?.username ??
                    user?.email}
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
                <DropdownMenuItem className='cursor-pointer'>
                  <span>Account</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSignOut()} className='cursor-pointer'>
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