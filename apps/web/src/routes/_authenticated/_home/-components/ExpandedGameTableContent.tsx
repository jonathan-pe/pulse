import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { UpcomingGame } from '@/routes/_authenticated/_home/-components/UpcomingGamesTable'

const ExpandedGameTableContent = ({ game }: { game: UpcomingGame }) => {
  // Right now we only work with 1 provider (NatStat)
  // but we'll probably need to build this out once we support more providers
  const odds = game.odds[0] ?? {}

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead />
          <TableHead>Moneyline</TableHead>
          <TableHead>Spread</TableHead>
          <TableHead>Over/Under</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableHead>{game.homeTeam}</TableHead>
          <TableHead>{odds.moneylineHome ? odds.moneylineHome : '-'}</TableHead>
          <TableHead>{odds.spread ? odds.spread : '-'}</TableHead>
          <TableHead>{odds.total ? `Over ${odds.total}` : '-'}</TableHead>
        </TableRow>

        <TableRow>
          <TableHead>{game.awayTeam}</TableHead>
          <TableHead>{odds.moneylineAway ? odds.moneylineAway : '-'}</TableHead>
          <TableHead>{odds.spread ? odds.spread * -1 : '-'}</TableHead>
          <TableHead>{odds.total ? `Under ${odds.total}` : '-'}</TableHead>
        </TableRow>
      </TableBody>
    </Table>
  )
}

export default ExpandedGameTableContent
