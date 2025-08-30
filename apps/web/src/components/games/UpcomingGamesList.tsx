import { trpc } from '@/lib/trpc'
import { useQuery } from '@tanstack/react-query'
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell, TableCaption } from '@/components/ui/table'

const UpcomingGamesList = () => {
  const { isLoading, error, data } = useQuery(trpc.games.listUpcoming.queryOptions({}))

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error loading upcoming games</div>

  const games = Array.isArray(data) ? data : []

  return (
    <div>
      <h2>Upcoming Games</h2>

      {games.length === 0 ? (
        <div>No upcoming games found.</div>
      ) : (
        <div className='w-full overflow-auto'>
          <Table>
            <TableCaption>List of upcoming games</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Home</TableHead>
                <TableHead>Away</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {games.map((game) => {
                return (
                  <TableRow key={game.id}>
                    <TableCell>{game.startsAt}</TableCell>
                    <TableCell>{game.homeTeam}</TableCell>
                    <TableCell>{game.awayTeam}</TableCell>
                    <TableCell>{game.status}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

export default UpcomingGamesList
