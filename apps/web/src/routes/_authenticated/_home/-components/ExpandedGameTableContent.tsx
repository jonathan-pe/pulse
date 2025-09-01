import { Button } from '@/components/ui/button'
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
          <TableHead className='w-[40%]' />
          <TableHead className='w-[20%]'>Moneyline</TableHead>
          <TableHead className='w-[20%]'>Spread</TableHead>
          <TableHead className='w-[20%]'>Over/Under</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableHead>{game.homeTeam}</TableHead>
          <TableHead>{odds.moneylineHome ? <Button variant='outline'>{odds.moneylineHome}</Button> : '-'}</TableHead>
          <TableHead>{odds.spread ? <Button variant='outline'>{odds.spread}</Button> : '-'}</TableHead>
          <TableHead>{odds.total ? <Button variant='outline'>{`Over ${odds.total}`}</Button> : '-'}</TableHead>
        </TableRow>

        <TableRow>
          <TableHead>{game.awayTeam}</TableHead>
          <TableHead>{odds.moneylineAway ? <Button variant='outline'>{odds.moneylineAway}</Button> : '-'}</TableHead>
          <TableHead>{odds.spread ? <Button variant='outline'>{odds.spread * -1}</Button> : '-'}</TableHead>
          <TableHead>{odds.total ? <Button variant='outline'>{`Under ${odds.total}`}</Button> : '-'}</TableHead>
        </TableRow>
      </TableBody>
    </Table>
  )
}

export default ExpandedGameTableContent
