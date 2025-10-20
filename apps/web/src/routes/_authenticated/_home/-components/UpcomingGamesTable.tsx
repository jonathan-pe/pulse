import { trpc } from '@/lib/trpc'
import { useQuery } from '@tanstack/react-query'
import { type ColumnDef, type CellContext } from '@tanstack/react-table'
import type { inferOutput } from '@trpc/tanstack-react-query'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ArrowUp, MinusIcon, PlusIcon } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import ExpandedGameTableContent from '@/routes/_authenticated/_home/-components/ExpandedGameTableContent'
import { toast } from 'sonner'
import { useEffect } from 'react'

export type UpcomingGame = inferOutput<typeof trpc.games.listUpcoming>[number]

const columns: ColumnDef<UpcomingGame>[] = [
  {
    id: 'odds',
    header: ({ table }) => (
      <Button onClick={() => table.toggleAllRowsExpanded()} variant='outline' size='icon'>
        {table.getIsAllRowsExpanded() ? <MinusIcon /> : <PlusIcon />}
      </Button>
    ),
    cell: ({ row }) =>
      row.getCanExpand() ? (
        <Button
          onClick={(e) => {
            e.stopPropagation()
            const toggle = row.getToggleExpandedHandler()
            if (toggle) toggle()
          }}
          variant='outline'
          size='icon'
        >
          {row.getIsExpanded() ? <MinusIcon /> : <PlusIcon />}
        </Button>
      ) : (
        ''
      ),
  },
  {
    accessorKey: 'startsAt',
    header: ({ column }) => (
      <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Date
        {column.getIsSorted() === 'asc' ? (
          <ArrowUp className='ml-2 h-4 w-4' />
        ) : column.getIsSorted() === 'desc' ? (
          <ArrowUp className='ml-2 h-4 w-4 rotate-180' />
        ) : null}
      </Button>
    ),
    cell: ({ row }: CellContext<UpcomingGame, unknown>) => {
      const value = row.getValue('startsAt') as string | Date
      const date = typeof value === 'string' ? new Date(value) : value
      if (!date) return null

      const day = date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
      const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

      return (
        <div className='flex flex-col'>
          <span className='font-medium'>{day}</span>
          <span className='text-xs text-muted-foreground'>{time}</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'homeTeam',
    header: ({ column }) => (
      <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Home
        {column.getIsSorted() === 'asc' ? (
          <ArrowUp className='ml-2 h-4 w-4' />
        ) : column.getIsSorted() === 'desc' ? (
          <ArrowUp className='ml-2 h-4 w-4 rotate-180' />
        ) : null}
      </Button>
    ),
    cell: ({ row }: CellContext<UpcomingGame, unknown>) => {
      const team = row.getValue('homeTeam') as string
      const initials = team
        ? team
            .split(' ')
            .map((s) => s[0])
            .slice(0, 2)
            .join('')
            .toUpperCase()
        : ''

      return (
        <div className='flex items-center gap-3'>
          <Avatar className='bg-gradient-to-br from-indigo-500 to-violet-500'>
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className='font-medium'>{team}</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'awayTeam',
    header: ({ column }) => (
      <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Away
        {column.getIsSorted() === 'asc' ? (
          <ArrowUp className='ml-2 h-4 w-4' />
        ) : column.getIsSorted() === 'desc' ? (
          <ArrowUp className='ml-2 h-4 w-4 rotate-180' />
        ) : null}
      </Button>
    ),
    cell: ({ row }: CellContext<UpcomingGame, unknown>) => {
      const team = row.getValue('awayTeam') as string
      const initials = team
        ? team
            .split(' ')
            .map((s) => s[0])
            .slice(0, 2)
            .join('')
            .toUpperCase()
        : ''

      return (
        <div className='flex items-center gap-3'>
          <Avatar className='bg-gradient-to-br from-emerald-400 to-green-600'>
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className='font-medium'>{team}</span>
        </div>
      )
    },
  },
]

const UpcomingGamesTable = ({ league }: { league?: string }) => {
  const navigate = useNavigate()

  const { isLoading, error, data } = useQuery(trpc.games.listUpcoming.queryOptions({ league }))

  useEffect(() => {
    if (error) {
      toast.error('Error loading upcoming games. Please try again.', { id: 'query-upcoming-games-error' })
    }
  }, [error])

  const games = Array.isArray(data) ? data : []

  return (
    <div className='flex flex-col gap-4'>
      <h2 className='text-lg font-semibold'>Upcoming Games</h2>

      <DataTable
        columns={columns}
        data={games}
        onRowClick={(row) => navigate({ to: `/games/${row.id}` })}
        rowCanExpand={(row) => row.odds.length > 0}
        renderExpandedContent={(row) => <ExpandedGameTableContent game={row} />}
        isLoading={isLoading}
      />
    </div>
  )
}

export default UpcomingGamesTable
