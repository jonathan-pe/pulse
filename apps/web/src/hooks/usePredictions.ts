import { trpc, trpcClient } from '@/lib/trpc'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { CartSelection } from '@/store/cart'

/**
 * Maps cart selections to prediction inputs for the API
 */
const mapCartSelectionToPrediction = (selection: CartSelection) => {
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

  return useMutation({
    mutationFn: async (selections: CartSelection[]) => {
      // Map cart selections to prediction inputs
      const predictions = selections.map(mapCartSelectionToPrediction)

      // Call the batch create endpoint
      const result = await trpcClient.predictions.createBatch.mutate({ predictions })

      return result
    },
    onSuccess: (data) => {
      // Invalidate predictions queries to refetch
      queryClient.invalidateQueries({ queryKey: ['predictions'] })

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

      return data
    },
    onError: (error) => {
      toast.error('Failed to create predictions', {
        description: error.message,
      })
    },
  })
}

/**
 * Hook to get daily prediction stats
 */
export const useDailyStats = () => {
  return useQuery(trpc.predictions.dailyStats.queryOptions())
}

/**
 * Hook to get pending predictions
 */
export const usePendingPredictions = () => {
  return useQuery(trpc.predictions.myPending.queryOptions())
}

/**
 * Hook to get prediction history
 */
export const usePredictionHistory = () => {
  return useQuery(trpc.predictions.myHistory.queryOptions())
}
