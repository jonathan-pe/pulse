import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/api'
import { useAuthenticatedFetch } from '@/hooks/useAuthenticatedFetch'
import type { PredictionInput, BatchPredictionsResult } from '@/types/api'
import { toast } from 'sonner'
import type { CartSelection } from '@/store/cart'

/**
 * Maps cart selections to prediction inputs for the API
 */
const mapCartSelectionToPrediction = (selection: CartSelection): PredictionInput => {
  let type: 'MONEYLINE' | 'SPREAD' | 'TOTAL'
  let pick: string

  if (selection.market === 'moneyline') {
    type = 'MONEYLINE'
    // For moneyline, pick is either 'home' or 'away'
    pick = selection.side
  } else if (selection.market === 'spread') {
    type = 'SPREAD'
    // For spread, pick is either 'home' or 'away'
    pick = selection.side
  } else {
    // total
    type = 'TOTAL'
    // For total, pick is 'over' or 'under'
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
  const fetchAPI = useAuthenticatedFetch()

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
