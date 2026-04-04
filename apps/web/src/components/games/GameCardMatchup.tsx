import type { GameWithUnifiedOdds } from '@pulse/types'
import { TeamLogo } from '@/components/TeamLogo'

type GameCardMatchupProps = {
  awayTeam: GameWithUnifiedOdds['awayTeam']
  homeTeam: GameWithUnifiedOdds['homeTeam']
  result: GameWithUnifiedOdds['result']
}

export function GameCardMatchup({ awayTeam, homeTeam, result }: GameCardMatchupProps) {
  return (
    <div className='mb-4 space-y-2'>
      <div className='flex items-center gap-3'>
        <TeamLogo logoUrl={awayTeam.logoUrl} teamName={awayTeam.name} teamCode={awayTeam.code} size='md' />
        <div className='flex-1'>
          <div className='font-medium'>{awayTeam.name}</div>
          {result && <div className='text-xl font-bold'>{result.awayScore}</div>}
        </div>
      </div>

      <div className='flex items-center gap-3'>
        <TeamLogo logoUrl={homeTeam.logoUrl} teamName={homeTeam.name} teamCode={homeTeam.code} size='md' />
        <div className='flex-1'>
          <div className='font-medium'>{homeTeam.name}</div>
          {result && <div className='text-xl font-bold'>{result.homeScore}</div>}
        </div>
      </div>
    </div>
  )
}
