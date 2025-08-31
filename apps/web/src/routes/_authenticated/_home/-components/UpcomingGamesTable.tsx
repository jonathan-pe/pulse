import { trpc } from '@/lib/trpc'
import { useQuery } from '@tanstack/react-query'
import { type ColumnDef, type CellContext } from '@tanstack/react-table'
import type { inferOutput } from '@trpc/tanstack-react-query'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { ArrowUp, MinusIcon, PlusIcon } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'

type UpcomingGame = inferOutput<typeof trpc.games.listUpcoming>[number]

const columns: ColumnDef<UpcomingGame>[] = [
  {
    id: 'odds',
    header: '',
    cell: ({ row }) => {
      return row.getCanExpand() ? (
        <Button
          onClick={(e) => {
            e.stopPropagation() // prevent row onClick

            const toggle = row.getToggleExpandedHandler()
            if (toggle) toggle() // invoke it
          }}
          variant='outline'
          size='icon'
        >
          {row.getIsExpanded() ? <MinusIcon /> : <PlusIcon />}
        </Button>
      ) : (
        ''
      )
    },
  },
  {
    accessorKey: 'startsAt',
    header: ({ column }) => {
      return (
        <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Date
          {column.getIsSorted() === 'asc' ? (
            <ArrowUp className='ml-2 h-4 w-4' />
          ) : column.getIsSorted() === 'desc' ? (
            <ArrowUp className='ml-2 h-4 w-4 rotate-180' />
          ) : null}
        </Button>
      )
    },
    cell: ({ row }: CellContext<UpcomingGame, unknown>) => {
      const value = row.getValue('startsAt') as string | Date
      const date = typeof value === 'string' ? new Date(value) : value
      return date?.toLocaleString()
    },
  },
  {
    accessorKey: 'homeTeam',
    header: ({ column }) => {
      return (
        <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Home
          {column.getIsSorted() === 'asc' ? (
            <ArrowUp className='ml-2 h-4 w-4' />
          ) : column.getIsSorted() === 'desc' ? (
            <ArrowUp className='ml-2 h-4 w-4 rotate-180' />
          ) : null}
        </Button>
      )
    },
  },
  {
    accessorKey: 'awayTeam',
    header: ({ column }) => {
      return (
        <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Away
          {column.getIsSorted() === 'asc' ? (
            <ArrowUp className='ml-2 h-4 w-4' />
          ) : column.getIsSorted() === 'desc' ? (
            <ArrowUp className='ml-2 h-4 w-4 rotate-180' />
          ) : null}
        </Button>
      )
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => {
      return (
        <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Status
          {column.getIsSorted() === 'asc' ? (
            <ArrowUp className='ml-2 h-4 w-4' />
          ) : column.getIsSorted() === 'desc' ? (
            <ArrowUp className='ml-2 h-4 w-4 rotate-180' />
          ) : null}
        </Button>
      )
    },
  },
]

const UpcomingGamesTable = () => {
  const navigate = useNavigate()

  const { isLoading, error, data } = useQuery(trpc.games.listUpcoming.queryOptions({}))

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error loading upcoming games</div>

  const games = Array.isArray(data) ? data : []

  return (
    <div className='flex flex-col gap-4'>
      <h2>Upcoming Games</h2>

      <DataTable
        columns={columns}
        data={games}
        onRowClick={(row) => navigate({ to: `/games/${row.id}` })}
        rowCanExpand={(row) => row.odds.length > 0}
        renderExpandedContent={(row) => (
          <div>
            Expanded content for {row.homeTeam} vs {row.awayTeam}
          </div>
        )}
      />
    </div>
  )
}

export default UpcomingGamesTable
