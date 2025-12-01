import { Link } from '@tanstack/react-router'
import {
  Home,
  Trophy,
  LayoutDashboard,
  ListChecks,
  // Sports icons
  type LucideIcon,
} from 'lucide-react'
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
  icon: LucideIcon
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
    icon: ListChecks,
  },
  {
    title: 'Leaderboard',
    url: '/leaderboard',
    icon: Trophy,
  },
]

// League navigation - using Trophy icon as placeholder for sports
const leagues: NavItem[] = [
  {
    title: 'NFL',
    url: '/leagues/$league',
    icon: Trophy,
    params: { league: 'nfl' },
  },
  {
    title: 'NBA',
    url: '/leagues/$league',
    icon: Trophy,
    params: { league: 'nba' },
  },
  {
    title: 'MLB',
    url: '/leagues/$league',
    icon: Trophy,
    params: { league: 'mlb' },
  },
  {
    title: 'NHL',
    url: '/leagues/$league',
    icon: Trophy,
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
            <div className='flex items-center justify-center py-2 group-data-[collapsible=icon]:flex hidden'>
              <AccountMenu />
            </div>

            {/* When expanded: show ThemeToggle + AccountMenu */}
            <div className='flex items-center gap-2 px-2 py-2 group-data-[collapsible=icon]:hidden'>
              <ThemeToggle />
              <div className='flex-1'>
                <AccountMenu />
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
