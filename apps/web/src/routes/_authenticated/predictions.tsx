import { createFileRoute } from '@tanstack/react-router'
import { usePredictionHistory } from '@/hooks/usePredictions'
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '@/components/ui/card'
import { TeamLogo } from '@/components/TeamLogo'
import { Badge } from '@/components/ui/badge'
import { Clock, CheckCircle } from 'lucide-react'
import { PredictionsSummaryHeader } from '@/components/predictions/PredictionsSummaryHeader'
import { PredictionItem } from '@/components/predictions/PredictionItem'
import { getLeagueBadgeColor } from '@/lib/utils'
import type { PredictionWithGame } from '@/types/api'

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

  // Group predictions by game
  const groupedPredictions = predictions.reduce((acc, prediction) => {
    const gameId = prediction.gameId
    if (!acc[gameId]) {
      acc[gameId] = []
    }
    acc[gameId].push(prediction)
    return acc
  }, {} as Record<string, PredictionWithGame[]>)

  return (
    <div className='w-full h-full overflow-y-auto'>
      <div className='container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8'>
        <h1 className='text-2xl sm:text-3xl font-bold mb-6'>My Predictions</h1>

        {/* Summary Stats */}
        <div className='mb-6'>
          <PredictionsSummaryHeader />
        </div>

        {/* Predictions Grid - 2 columns on larger screens */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
          {Object.entries(groupedPredictions).map(([gameId, gamePredictions]) => {
            const game = gamePredictions[0].game
            const hasResult = game.result !== null && game.result !== undefined
            const gameStarted = new Date(game.startsAt) <= new Date()

            // Game status: completed (has result) > live (started, no result) > pending (not started)
            const isCompleted = hasResult
            const isLive = !isCompleted && gameStarted
            const isPending = !isCompleted && !gameStarted

            return (
              <Card key={gameId} className='flex flex-col'>
                <CardHeader className='pb-3'>
                  <div className='flex items-start justify-between gap-2'>
                    <div className='flex items-center gap-3 flex-1 min-w-0'>
                      <div className='flex items-center gap-2'>
                        <TeamLogo
                          teamName={game.awayTeam.name}
                          teamCode={game.awayTeam.code}
                          logoUrl={game.awayTeam.logoUrl}
                          size='sm'
                        />
                        <span className='font-medium text-sm'>{game.awayTeam.code}</span>
                      </div>
                      <span className='text-muted-foreground text-sm'>@</span>
                      <div className='flex items-center gap-2'>
                        <TeamLogo
                          teamName={game.homeTeam.name}
                          teamCode={game.homeTeam.code}
                          logoUrl={game.homeTeam.logoUrl}
                          size='sm'
                        />
                        <span className='font-medium text-sm'>{game.homeTeam.code}</span>
                      </div>
                    </div>

                    {/* League badge */}
                    <Badge variant='outline' className={getLeagueBadgeColor(game.league)}>
                      {game.league}
                    </Badge>
                  </div>

                  <div className='flex items-center gap-2'>
                    <CardDescription className='text-xs'>
                      {new Date(game.startsAt).toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </CardDescription>
                    {isCompleted && (
                      <Badge
                        variant='secondary'
                        className='h-5 text-xs bg-green-500/10 text-green-700 border-green-500/20'
                      >
                        <CheckCircle className='h-2.5 w-2.5 mr-1' />
                        Final
                      </Badge>
                    )}
                    {isLive && (
                      <Badge variant='secondary' className='h-5 text-xs'>
                        <Clock className='h-2.5 w-2.5 mr-1' />
                        Live
                      </Badge>
                    )}
                    {isPending && (
                      <Badge variant='outline' className='h-5 text-xs'>
                        <Clock className='h-2.5 w-2.5 mr-1' />
                        Pending
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className='flex-1 pt-0'>
                  {/* List all predictions for this game */}
                  {gamePredictions.map((prediction, index) => (
                    <PredictionItem key={prediction.id} prediction={prediction} showDivider={index > 0} />
                  ))}
                </CardContent>

                {/* Game result footer - shown for completed games */}
                {isCompleted && game.result && (
                  <CardFooter className='pt-4 border-t bg-muted/30 mt-auto'>
                    <div className='w-full'>
                      <div className='text-xs font-medium text-muted-foreground mb-2'>Final Score</div>
                      <div className='flex items-center gap-4'>
                        <div className='flex-1'>
                          <div className='text-xs text-muted-foreground'>{game.awayTeam.code}</div>
                          <div className='text-lg font-bold'>{game.result.awayScore}</div>
                        </div>
                        <div className='flex-1'>
                          <div className='text-xs text-muted-foreground'>{game.homeTeam.code}</div>
                          <div className='text-lg font-bold'>{game.result.homeScore}</div>
                        </div>
                      </div>
                    </div>
                  </CardFooter>
                )}
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
