import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/api'
import { useAPI } from './useAPI'
import type {
  PredictionInput,
  BatchPredictionsResult,
  PredictionsResponse,
  PredictionWithGame,
  PredictionsByGameResponse,
  DailyStats,
} from '@/types/api'
import { toast } from 'sonner'
import type { CartSelection } from '@/store/cart'

// ============================================================================
// Query Hooks (GET requests)
// ============================================================================

/**
 * Fetch all predictions for the current user
 */
export const usePredictions = (options?: { enabled?: boolean }) => {
  const fetchAPI = useAPI()

  return useQuery({
    queryKey: queryKeys.predictions.all,
    queryFn: () => fetchAPI<PredictionsResponse>('/predictions'),
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Fetch prediction history with full game details
 */
export const usePredictionHistory = () => {
  const fetchAPI = useAPI()

  return useQuery({
    queryKey: queryKeys.predictions.history(),
    queryFn: () => fetchAPI<PredictionWithGame[]>('/predictions/history'),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Fetch pending predictions
 */
export const usePendingPredictions = () => {
  const fetchAPI = useAPI()

  return useQuery({
    queryKey: queryKeys.predictions.pending(),
    queryFn: () => fetchAPI<PredictionsResponse>('/predictions/pending'),
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

/**
 * Fetch predictions grouped by game and type
 * Useful for checking what predictions a user has already made
 */
export const usePredictionsByGame = () => {
  const fetchAPI = useAPI()

  return useQuery({
    queryKey: queryKeys.predictions.byGame(),
    queryFn: () => fetchAPI<PredictionsByGameResponse>('/predictions/by-game'),
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

/**
 * Fetch daily prediction statistics
 */
export const useDailyPredictionStats = () => {
  const fetchAPI = useAPI()

  return useQuery({
    queryKey: queryKeys.predictions.dailyStats(),
    queryFn: () => fetchAPI<DailyStats>('/predictions/daily-stats'),
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Get prediction statistics derived from the predictions list
 */
export const usePredictionStats = () => {
  const { data: response, isLoading } = usePredictions()

  const stats = response?.predictions.reduce(
    (acc, _pred) => {
      // Note: Adjust these status checks based on your actual API response
      // This is a placeholder - update based on actual prediction status fields
      acc.total++
      return acc
    },
    { won: 0, lost: 0, pending: 0, total: 0 }
  )

  return {
    stats,
    isLoading,
    winRate: stats && stats.won + stats.lost > 0 ? ((stats.won / (stats.won + stats.lost)) * 100).toFixed(1) : '0.0',
  }
}

// ============================================================================
// Mutation Hooks (POST/PUT/DELETE requests)
// ============================================================================

/**
 * Maps cart selections to prediction inputs for the API
 */
const mapCartSelectionToPrediction = (selection: CartSelection): PredictionInput => {
  let type: 'MONEYLINE' | 'SPREAD' | 'TOTAL'
  let pick: string

  if (selection.market === 'moneyline') {
    type = 'MONEYLINE'
    pick = selection.side
  } else if (selection.market === 'spread') {
    type = 'SPREAD'
    pick = selection.side
  } else {
    // total
    type = 'TOTAL'
    pick = selection.side
  }

  return {
    gameId: selection.gameId,
    type,
    pick,
  }
}

/**
 * Hook to create a batch of predictions from cart selections
 */
export const useCreatePredictions = () => {
  const queryClient = useQueryClient()
  const fetchAPI = useAPI()

  return useMutation({
    mutationFn: (predictions: PredictionInput[]) =>
      fetchAPI<BatchPredictionsResult>('/predictions/batch', {
        method: 'POST',
        body: JSON.stringify({ predictions }),
      }),
    onSuccess: (data) => {
      // Invalidate prediction-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.predictions.all })

      // Show success toast
      const successCount = data.created.length
      const failedCount = data.errors.length

      if (successCount > 0) {
        toast.success(`Successfully created ${successCount} prediction${successCount > 1 ? 's' : ''}!`, {
          description: failedCount > 0 ? `${failedCount} prediction${failedCount > 1 ? 's' : ''} failed.` : undefined,
        })
      }

      if (failedCount > 0 && successCount === 0) {
        toast.error('Failed to create predictions', {
          description: data.errors.map((e: { error: string }) => e.error).join(', '),
        })
      }
    },
    onError: (error) => {
      toast.error('Failed to create predictions', {
        description: error.message,
      })
    },
  })
}

/**
 * Helper to create predictions from cart selections
 * Handles conversion and provides user feedback via toasts
 */
export const useCreatePredictionsFromCart = () => {
  const mutation = useCreatePredictions()

  return {
    ...mutation,
    mutate: (selections: CartSelection[]) => {
      const predictions = selections.map(mapCartSelectionToPrediction)
      mutation.mutate(predictions)
    },
    mutateAsync: async (selections: CartSelection[]) => {
      const predictions = selections.map(mapCartSelectionToPrediction)
      return mutation.mutateAsync(predictions)
    },
  }
}
