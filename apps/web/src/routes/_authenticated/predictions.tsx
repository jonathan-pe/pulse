import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useParlays, usePredictionHistory } from '@/hooks/usePredictions'
import { Card, CardContent } from '@/components/ui/card'
import { GamePredictionsCard } from '@/components/predictions/GamePredictionsCard'
import { ParlayTimelineCard } from '@/components/predictions/ParlayTimelineCard'
import { PredictionsSummaryHeader } from '@/components/predictions/PredictionsSummaryHeader'
import { PredictionsFilters } from '@/components/predictions/PredictionsFilters'
import type { StatusFilter, LeagueFilter, ResultFilter } from '@/types/filters'
import { buildMergedTimeline, filterTimeline } from '@/lib/predictions-timeline'

export const Route = createFileRoute('/_authenticated/predictions')({
  component: PredictionsPage,
})

function PredictionsPage() {
  const { data: predictions, isLoading: predictionsLoading } = usePredictionHistory()
  const { data: parlays = [], isLoading: parlaysLoading } = useParlays({ enabled: true })

  const isLoading = predictionsLoading || parlaysLoading

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [leagueFilter, setLeagueFilter] = useState<LeagueFilter>('all')
  const [resultFilter, setResultFilter] = useState<ResultFilter>('all')

  const hasActiveFilters = statusFilter !== 'all' || leagueFilter !== 'all' || resultFilter !== 'all'

  const clearFilters = () => {
    setStatusFilter('all')
    setLeagueFilter('all')
    setResultFilter('all')
  }

  const mergedTimeline = useMemo(
    () => buildMergedTimeline(predictions ?? [], parlays),
    [predictions, parlays]
  )

  const filteredTimeline = useMemo(
    () => filterTimeline(mergedTimeline, statusFilter, leagueFilter, resultFilter),
    [mergedTimeline, statusFilter, leagueFilter, resultFilter]
  )

  const hasAnyActivity = (predictions?.length ?? 0) > 0 || parlays.length > 0

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

  if (!hasAnyActivity) {
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

        <div className='mb-6'>
          <PredictionsSummaryHeader />
        </div>

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

        {filteredTimeline.length === 0 && (
          <Card className='mb-6'>
            <CardContent>
              <p className='text-muted-foreground text-center'>
                No predictions match your filters.{' '}
                <button type='button' onClick={clearFilters} className='text-primary hover:underline'>
                  Clear filters
                </button>
              </p>
            </CardContent>
          </Card>
        )}

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
          {filteredTimeline.map((item) =>
            item.kind === 'single' ? (
              <GamePredictionsCard key={item.prediction.id} gamePredictions={[item.prediction]} />
            ) : (
              <ParlayTimelineCard key={item.parlay.id} parlay={item.parlay} />
            )
          )}
        </div>
      </div>
    </div>
  )
}
