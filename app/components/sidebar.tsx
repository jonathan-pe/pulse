'use client'

import * as React from 'react'
import { ChevronUp, User2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/app/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu'
import SportsbookComboBox from './sportsbook-combobox'
import { SUPPORTED_LEAGUES, SUPPORTED_SPORTS } from '../constants'
import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const supabase = createClient()
  const router = useRouter()

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
      toast.success('Successfully logged out.')
      router.push('/')
    }
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SportsbookComboBox />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Leagues</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {SUPPORTED_LEAGUES.map((league) => (
                <SidebarMenuItem key={league}>
                  <SidebarMenuButton>{league}</SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Sports</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {SUPPORTED_SPORTS.map((sport) => (
                <SidebarMenuItem key={sport}>
                  <SidebarMenuButton>{sport}</SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <User2 /> {user?.user_metadata?.display_name ?? user?.email}
                  <ChevronUp className='ml-auto' />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side='top' className='w-[--radix-popper-anchor-width]'>
                <DropdownMenuItem className='cursor-pointer'>
                  <span>Account</span>
                </DropdownMenuItem>
                <DropdownMenuItem className='cursor-pointer'>
                  <span>Billing</span>
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
