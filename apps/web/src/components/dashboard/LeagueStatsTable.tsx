import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { LeagueStats } from '@pulse/types'
import { Badge } from '@/components/ui/badge'
import { getLeagueBadgeColor } from '@/lib/utils'

interface LeagueStatsTableProps {
  stats: LeagueStats[]
  isLoading?: boolean
}

export function LeagueStatsTable({ stats, isLoading }: LeagueStatsTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance by League</CardTitle>
          <CardDescription>Your win rates across different sports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='h-48 flex items-center justify-center text-muted-foreground'>Loading...</div>
        </CardContent>
      </Card>
    )
  }

  if (stats.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance by League</CardTitle>
          <CardDescription>Your win rates across different sports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='h-48 flex items-center justify-center text-muted-foreground'>
            No predictions yet. Start making predictions to see your stats!
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance by League</CardTitle>
        <CardDescription>Your win rates and points earned by sport</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>League</TableHead>
              <TableHead className='text-right'>Predictions</TableHead>
              <TableHead className='text-right'>Correct</TableHead>
              <TableHead className='text-right'>Win Rate</TableHead>
              <TableHead className='text-right'>Points</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats.map((league) => (
              <TableRow key={league.league}>
                <TableCell className='font-medium'>
                  <Badge variant='outline' className={getLeagueBadgeColor(league.league)}>
                    {league.league}
                  </Badge>
                </TableCell>
                <TableCell className='text-right'>{league.totalPredictions}</TableCell>
                <TableCell className='text-right'>{league.correctPredictions}</TableCell>
                <TableCell className='text-right'>
                  <span
                    className={
                      league.winRate >= 0.6
                        ? 'text-green-600 dark:text-green-400 font-semibold'
                        : league.winRate >= 0.5
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-muted-foreground'
                    }
                  >
                    {(league.winRate * 100).toFixed(1)}%
                  </span>
                </TableCell>
                <TableCell className='text-right font-semibold'>{league.pointsEarned}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
