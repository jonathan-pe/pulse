import { useState, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { usePredictionHistory } from '@/hooks/usePredictions'
import { Card, CardContent } from '@/components/ui/card'
import { GamePredictionsCard } from '@/components/predictions/GamePredictionsCard'
import { PredictionsSummaryHeader } from '@/components/predictions/PredictionsSummaryHeader'
import { PredictionsFilters } from '@/components/predictions/PredictionsFilters'
import type { StatusFilter, LeagueFilter, ResultFilter } from '@/types/filters'
import type { PredictionWithGame } from '@/types/api'

export const Route = createFileRoute('/_authenticated/predictions')({
  component: PredictionsPage,
})

function PredictionsPage() {
  const { data: predictions, isLoading } = usePredictionHistory()

  // Filter state
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [leagueFilter, setLeagueFilter] = useState<LeagueFilter>('all')
  const [resultFilter, setResultFilter] = useState<ResultFilter>('all')

  const hasActiveFilters = statusFilter !== 'all' || leagueFilter !== 'all' || resultFilter !== 'all'

  const clearFilters = () => {
    setStatusFilter('all')
    setLeagueFilter('all')
    setResultFilter('all')
  }

  // Helper to determine game status
  const getGameStatus = (prediction: PredictionWithGame) => {
    const game = prediction.game
    const hasResult = game.result !== null && game.result !== undefined
    const gameStarted = new Date(game.startsAt) <= new Date()

    if (hasResult) return 'completed'
    if (gameStarted) return 'live'
    return 'pending'
  }

  // Filter predictions
  const filteredPredictions = useMemo(() => {
    if (!predictions) return []

    return predictions.filter((prediction) => {
      // Status filter
      if (statusFilter !== 'all') {
        const status = getGameStatus(prediction)
        if (status !== statusFilter) return false
      }

      // League filter
      if (leagueFilter !== 'all') {
        if (prediction.game.league !== leagueFilter) return false
      }

      // Result filter (only applies to completed predictions)
      if (resultFilter !== 'all') {
        if (prediction.isCorrect === null) return false // Not yet scored
        if (resultFilter === 'wins' && prediction.isCorrect !== true) return false
        if (resultFilter === 'losses' && prediction.isCorrect !== false) return false
      }

      return true
    })
  }, [predictions, statusFilter, leagueFilter, resultFilter])

  // Group filtered predictions by game
  const groupedPredictions = useMemo(() => {
    return filteredPredictions.reduce((acc, prediction) => {
      const gameId = prediction.gameId
      if (!acc[gameId]) {
        acc[gameId] = []
      }
      acc[gameId].push(prediction)
      return acc
    }, {} as Record<string, PredictionWithGame[]>)
  }, [filteredPredictions])

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

        {/* Summary Stats */}
        <div className='mb-6'>
          <PredictionsSummaryHeader />
        </div>

        {/* Filters */}
        <div className='mb-6'>
          <PredictionsFilters
            statusFilter={statusFilter}
            leagueFilter={leagueFilter}
            resultFilter={resultFilter}
            onStatusChange={setStatusFilter}
            onLeagueChange={setLeagueFilter}
            onResultChange={setResultFilter}
            onClearFilters={clearFilters}
            hasActiveFilters={hasActiveFilters}
          />
        </div>

        {/* No results after filtering */}
        {Object.keys(groupedPredictions).length === 0 && (
          <Card>
            <CardContent>
              <p className='text-muted-foreground text-center'>
                No predictions match your filters.{' '}
                <button onClick={clearFilters} className='text-primary hover:underline'>
                  Clear filters
                </button>
              </p>
            </CardContent>
          </Card>
        )}

        {/* Predictions Grid - 2 columns on larger screens */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
          {Object.entries(groupedPredictions).map(([gameId, gamePredictions]) => (
            <GamePredictionsCard key={gameId} gamePredictions={gamePredictions} />
          ))}
        </div>
      </div>
    </div>
  )
}
