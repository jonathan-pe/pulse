import { Link } from '@tanstack/react-router'
import { Home, Trophy, LayoutDashboard, type LucideIcon } from 'lucide-react'
import { GiAmericanFootballBall, GiBaseballGlove, GiHockey } from 'react-icons/gi'
import { TbCrystalBall } from 'react-icons/tb'
import { PiBasketballDuotone } from 'react-icons/pi'

import type { IconType } from 'react-icons'
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
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import AccountMenu from '@/components/layout/AccountMenu'
import ThemeToggle from '@/components/ui/theme-toggle'

// Navigation items structure
type NavItem = {
  title: string
  url: string
  icon: LucideIcon | IconType
  params?: Record<string, string>
}

// Main navigation
const navMain: NavItem[] = [
  {
    title: 'Home',
    url: '/',
    icon: Home,
  },
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'My Predictions',
    url: '/predictions',
    icon: TbCrystalBall,
  },
  {
    title: 'Leaderboard',
    url: '/leaderboard',
    icon: Trophy,
  },
]

// League navigation - sport-specific icons
const leagues: NavItem[] = [
  {
    title: 'NFL',
    url: '/leagues/$league',
    icon: GiAmericanFootballBall,
    params: { league: 'nfl' },
  },
  {
    title: 'NBA',
    url: '/leagues/$league',
    icon: PiBasketballDuotone,
    params: { league: 'nba' },
  },
  {
    title: 'MLB',
    url: '/leagues/$league',
    icon: GiBaseballGlove,
    params: { league: 'mlb' },
  },
  {
    title: 'NHL',
    url: '/leagues/$league',
    icon: GiHockey,
    params: { league: 'nhl' },
  },
]

export default function AppSidebar() {
  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader className='border-b border-sidebar-border'>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link to='/' className='flex items-center gap-3 px-2 py-2'>
              <img src='/pulse_logo.png' alt='Pulse' className='h-8 w-8 flex-shrink-0 object-contain' />
              <span className='font-semibold text-lg group-data-[collapsible=icon]:hidden'>Pulse</span>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link to={item.url} activeProps={{ className: 'bg-sidebar-accent' }}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Leagues */}
        <SidebarGroup>
          <SidebarGroupLabel>Leagues</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {leagues.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link
                      to={item.url}
                      params={item.params}
                      activeProps={{ className: 'bg-sidebar-accent' }}
                      activeOptions={{ exact: false }}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className='border-t border-sidebar-border'>
        <SidebarMenu>
          <SidebarMenuItem>
            {/* When collapsed: show only AccountMenu centered */}
            <div className='items-center justify-center py-2 group-data-[collapsible=icon]:flex hidden'>
              <AccountMenu />
            </div>

            {/* When expanded: show ThemeToggle + AccountMenu */}
            <div className='flex flex-1 items-center gap-2 px-2 py-2 group-data-[collapsible=icon]:hidden justify-between'>
              <div className='flex-1'>
                <AccountMenu />
              </div>
              <ThemeToggle />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
