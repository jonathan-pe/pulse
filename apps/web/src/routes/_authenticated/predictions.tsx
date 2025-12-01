import { createFileRoute } from '@tanstack/react-router'
import { usePredictionHistory } from '@/hooks/usePredictions'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { TeamLogo } from '@/components/TeamLogo'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock } from 'lucide-react'
import { DailyPredictionStats } from '@/components/DailyPredictionStats'

export const Route = createFileRoute('/_authenticated/predictions')({
  component: PredictionsPage,
})

function PredictionsPage() {
  const { data: predictions, isLoading } = usePredictionHistory()

  if (isLoading) {
    return (
      <div className='w-full h-full overflow-y-auto'>
        <div className='container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8'>
          <h1 className='text-2xl sm:text-3xl font-bold mb-6'>My Predictions</h1>
          <p className='text-muted-foreground'>Loading predictions...</p>
        </div>
      </div>
    )
  }

  if (!predictions || predictions.length === 0) {
    return (
      <div className='w-full h-full overflow-y-auto'>
        <div className='container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8'>
          <h1 className='text-2xl sm:text-3xl font-bold mb-6'>My Predictions</h1>
          <Card>
            <CardContent className='pt-6'>
              <p className='text-muted-foreground text-center'>No predictions yet. Start making predictions!</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className='w-full h-full overflow-y-auto'>
      <div className='container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8'>
        <h1 className='text-2xl sm:text-3xl font-bold mb-6'>My Predictions</h1>

        {/* Daily Stats */}
        <div className='mb-6'>
          <DailyPredictionStats />
        </div>

        <div className='space-y-4'>
          {predictions.map((prediction) => {
            const game = prediction.game
            const isLocked = prediction.lockedAt !== null
            const hasResult = game.result !== null

            // Format the pick for display
            let pickDisplay = ''
            if (prediction.type === 'MONEYLINE') {
              const team = prediction.pick === 'home' ? game.homeTeam.name : game.awayTeam.name
              pickDisplay = `${team} to Win`
            } else if (prediction.type === 'SPREAD') {
              const team = prediction.pick === 'home' ? game.homeTeam.name : game.awayTeam.name
              pickDisplay = `${team} to Cover`
            } else if (prediction.type === 'TOTAL') {
              pickDisplay = prediction.pick === 'over' ? 'Over' : 'Under'
            }

            return (
              <Card key={prediction.id}>
                <CardHeader>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-4'>
                      <div className='flex items-center gap-2'>
                        <TeamLogo
                          teamName={game.awayTeam.name}
                          teamCode={game.awayTeam.code}
                          logoUrl={game.awayTeam.logoUrl}
                          size='sm'
                        />
                        <span className='font-medium'>{game.awayTeam.name}</span>
                      </div>
                      <span className='text-muted-foreground'>@</span>
                      <div className='flex items-center gap-2'>
                        <TeamLogo
                          teamName={game.homeTeam.name}
                          teamCode={game.homeTeam.code}
                          logoUrl={game.homeTeam.logoUrl}
                          size='sm'
                        />
                        <span className='font-medium'>{game.homeTeam.name}</span>
                      </div>
                    </div>

                    {/* Status badge */}
                    {hasResult && (
                      <Badge variant='default' className='bg-green-500 hover:bg-green-600'>
                        <CheckCircle className='h-3 w-3 mr-1' />
                        Complete
                      </Badge>
                    )}
                    {!hasResult && !isLocked && (
                      <Badge variant='outline'>
                        <Clock className='h-3 w-3 mr-1' />
                        Pending
                      </Badge>
                    )}
                    {!hasResult && isLocked && (
                      <Badge variant='secondary'>
                        <Clock className='h-3 w-3 mr-1' />
                        In Progress
                      </Badge>
                    )}
                  </div>

                  <CardDescription>
                    {new Date(game.startsAt).toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div>
                    <div className='text-sm text-muted-foreground mb-1'>Your Prediction</div>
                    <div className='font-medium'>{pickDisplay}</div>
                    <div className='text-xs text-muted-foreground mt-1'>Type: {prediction.type}</div>
                  </div>

                  {/* Show game result if available */}
                  {hasResult && game.result && (
                    <div className='mt-4 pt-4 border-t'>
                      <div className='text-sm font-medium mb-2'>Final Score</div>
                      <div className='flex items-center gap-4'>
                        <div className='flex-1'>
                          <div className='text-xs text-muted-foreground'>{game.awayTeam.name}</div>
                          <div className='text-lg font-bold'>{game.result.awayScore}</div>
                        </div>
                        <div className='flex-1'>
                          <div className='text-xs text-muted-foreground'>{game.homeTeam.name}</div>
                          <div className='text-lg font-bold'>{game.result.homeScore}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
