import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Award, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PredictionWithGame } from '@/types/api'

interface PredictionItemProps {
  prediction: PredictionWithGame
  showDivider?: boolean
}

export function PredictionItem({ prediction, showDivider = false }: PredictionItemProps) {
  const game = prediction.game
  const isCorrect = prediction.isCorrect === true
  const isIncorrect = prediction.isCorrect === false

  // Format the pick for display with actual odds
  let pickDisplay = ''

  if (prediction.type === 'MONEYLINE') {
    const team = prediction.pick === 'home' ? game.homeTeam.name : game.awayTeam.name
    const odds = prediction.oddsAtPrediction?.moneyline
    const teamOdds = prediction.pick === 'home' ? odds?.home : odds?.away

    if (teamOdds) {
      const oddsFormatted = teamOdds > 0 ? `+${teamOdds}` : `${teamOdds}`
      pickDisplay = `${team} (${oddsFormatted})`
    } else {
      pickDisplay = `${team} to Win`
    }
  } else if (prediction.type === 'SPREAD') {
    const team = prediction.pick === 'home' ? game.homeTeam.name : game.awayTeam.name
    const spread = prediction.oddsAtPrediction?.spread

    if (spread && spread.value !== undefined) {
      // The spread value is already relative to home team
      // If home is favored, spread.value is negative (e.g., -3.5)
      // If away is favored, spread.value is positive (e.g., +3.5)
      const spreadValue = prediction.pick === 'home' ? spread.value : -spread.value

      pickDisplay = `${team} (${spreadValue > 0 ? '+' : ''}${spreadValue})`
    } else {
      pickDisplay = `${team} to Cover`
    }
  } else if (prediction.type === 'TOTAL') {
    const total = prediction.oddsAtPrediction?.total
    const side = prediction.pick === 'over' ? 'Over' : 'Under'

    if (total && total.value !== undefined) {
      pickDisplay = `${side} ${total.value}`
    } else {
      pickDisplay = side
    }
  }

  return (
    <>
      {showDivider && <div className='border-t my-3' />}
      <div className='flex items-start justify-between gap-4'>
        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-2 mb-1'>
            <span className='text-xs font-medium text-muted-foreground uppercase'>{prediction.type}</span>

            {/* Bonus tier badge */}
            {prediction.bonusTier && (
              <Badge variant='secondary' className='h-5 bg-amber-500/10 text-amber-700 border-amber-500/20'>
                <Award className='h-2.5 w-2.5 mr-1' />
                Bonus
              </Badge>
            )}

            {/* Result badge - only Win/Loss shown here, Live/Pending are at card level */}
            {isCorrect && (
              <Badge variant='default' className='h-5 bg-success hover:bg-success/90'>
                <CheckCircle className='h-2.5 w-2.5 mr-1' />
                Win
              </Badge>
            )}
            {isIncorrect && (
              <Badge variant='default' className='h-5 bg-destructive hover:bg-destructive/90'>
                <XCircle className='h-2.5 w-2.5 mr-1' />
                Loss
              </Badge>
            )}
          </div>

          <div className='font-medium'>{pickDisplay}</div>
        </div>

        {/* Points earned */}
        {prediction.pointsEarned != null && prediction.pointsEarned !== 0 && (
          <div className='text-right flex-shrink-0'>
            <div
              className={cn(
                'text-xl font-bold flex items-center gap-1',
                isCorrect && 'text-success',
                isIncorrect && 'text-muted-foreground'
              )}
            >
              <TrendingUp className='h-3.5 w-3.5' />
              {prediction.pointsEarned > 0 ? `+${prediction.pointsEarned}` : prediction.pointsEarned}
            </div>
            <div className='text-xs text-muted-foreground'>pts</div>
          </div>
        )}
      </div>
    </>
  )
}
