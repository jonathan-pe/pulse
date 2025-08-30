import { trpc } from '@/lib/trpc'
import { useQuery } from '@tanstack/react-query'

const UpcomingGamesList = () => {
  console.log(trpc)
  const { isLoading, error, data } = useQuery(trpc.games.listUpcoming.queryOptions({}))

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error loading upcoming games</div>

  console.log(data)

  return (
    <div>
      <h2>Upcoming Games</h2>
      {/* Render the list of upcoming games here */}
    </div>
  )
}

export default UpcomingGamesList
