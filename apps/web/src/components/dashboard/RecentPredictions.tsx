import { Link } from '@tanstack/react-router'
import { usePredictionHistory } from '@/hooks/usePredictions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CheckCircle, XCircle, Clock, ChevronRight, Award, TrendingUp, Timer } from 'lucide-react'
import { getLeagueBadgeColor, cn } from '@/lib/utils'

export function RecentPredictions() {
  const { data: predictions, isLoading } = usePredictionHistory()

  // Get the 5 most recent predictions
  const recentPredictions = predictions?.slice(0, 5) ?? []

  if (isLoading) {
    return (
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-lg'>Recent Predictions</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          {[1, 2, 3].map((i) => (
            <div key={i} className='flex items-center gap-3'>
              <Skeleton className='h-10 w-10 rounded' />
              <div className='flex-1 space-y-2'>
                <Skeleton className='h-4 w-3/4' />
                <Skeleton className='h-3 w-1/2' />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (recentPredictions.length === 0) {
    return (
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-lg'>Recent Predictions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-muted-foreground text-center py-4'>
            No predictions yet.{' '}
            <Link to='/' className='text-primary hover:underline'>
              Make your first prediction!
            </Link>
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-lg'>Recent Predictions</CardTitle>
          <Button variant='ghost' size='sm' asChild>
            <Link to='/predictions' className='text-sm'>
              View All
              <ChevronRight className='h-4 w-4 ml-1' />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className='space-y-3'>
        {recentPredictions.map((prediction) => {
          const game = prediction.game
          const isCorrect = prediction.isCorrect === true
          const isIncorrect = prediction.isCorrect === false
          const hasResult = game.result !== null && game.result !== undefined
          const gameStarted = new Date(game.startsAt) <= new Date()

          // Game hasn't started yet - show timer
          const isUpcoming = !gameStarted
          // Game is in progress (started but no result yet)
          const isLive = gameStarted && !hasResult

          // Format the pick with full team name and odds
          let pickDisplay = ''
          let pickSubtitle = '' // prediction type label

          if (prediction.type === 'MONEYLINE') {
            const teamName = prediction.pick === 'home' ? game.homeTeam.name : game.awayTeam.name
            const odds = prediction.oddsAtPrediction?.moneyline
            const teamOdds = prediction.pick === 'home' ? odds?.home : odds?.away

            if (teamOdds) {
              const oddsFormatted = teamOdds > 0 ? `+${teamOdds}` : `${teamOdds}`
              pickDisplay = `${teamName} (${oddsFormatted})`
            } else {
              pickDisplay = `${teamName}`
            }
            pickSubtitle = 'Moneyline'
          } else if (prediction.type === 'SPREAD') {
            const teamName = prediction.pick === 'home' ? game.homeTeam.name : game.awayTeam.name
            const spread = prediction.oddsAtPrediction?.spread

            if (spread?.value !== undefined) {
              const spreadValue = prediction.pick === 'home' ? spread.value : -spread.value
              const spreadFormatted = spreadValue > 0 ? `+${spreadValue}` : `${spreadValue}`
              pickDisplay = `${teamName} (${spreadFormatted})`
            } else {
              pickDisplay = `${teamName}`
            }
            pickSubtitle = 'Spread'
          } else if (prediction.type === 'TOTAL') {
            const total = prediction.oddsAtPrediction?.total
            const side = prediction.pick === 'over' ? 'Over' : 'Under'

            if (total?.value !== undefined) {
              pickDisplay = `${side} ${total.value}`
            } else {
              pickDisplay = side
            }
            pickSubtitle = 'Total'
          }

          return (
            <div key={prediction.id} className='flex items-center gap-3 py-2 border-b last:border-0'>
              {/* Status icon - mutually exclusive states */}
              <div className='flex-shrink-0'>
                {isUpcoming ? (
                  <Timer className='h-5 w-5 text-muted-foreground' />
                ) : isLive ? (
                  <Clock className='h-5 w-5 text-amber-500' />
                ) : isCorrect ? (
                  <CheckCircle className='h-5 w-5 text-green-500' />
                ) : isIncorrect ? (
                  <XCircle className='h-5 w-5 text-red-500' />
                ) : (
                  <Clock className='h-5 w-5 text-muted-foreground' />
                )}
              </div>

              {/* Prediction details */}
              <div className='flex-1 min-w-0'>
                <div className='flex items-center gap-2 mb-0.5'>
                  <span className='font-medium text-sm'>{pickDisplay}</span>
                  {prediction.bonusTier && <Award className='h-3.5 w-3.5 text-amber-500 flex-shrink-0' />}
                </div>
                <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                  <span className='font-medium'>{pickSubtitle}</span>
                  <span>•</span>
                  <span>
                    {game.awayTeam.code} @ {game.homeTeam.code}
                  </span>
                  <Badge variant='outline' className={`h-4 text-[10px] ${getLeagueBadgeColor(game.league)}`}>
                    {game.league}
                  </Badge>
                </div>
              </div>

              {/* Points earned/lost */}
              {prediction.pointsEarned != null && prediction.pointsEarned !== 0 && (
                <div
                  className={cn(
                    'flex items-center gap-1 font-medium text-sm',
                    prediction.pointsEarned > 0 && 'text-green-600',
                    prediction.pointsEarned < 0 && 'text-red-600'
                  )}
                >
                  <TrendingUp className='h-3.5 w-3.5' />
                  {prediction.pointsEarned > 0 ? `+${prediction.pointsEarned}` : prediction.pointsEarned}
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
