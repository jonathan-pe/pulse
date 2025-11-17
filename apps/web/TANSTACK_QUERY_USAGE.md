# TanStack Query Usage Guide

This project uses TanStack Query (React Query) for server state management. **Components use `useQuery` and `useMutation` directly** for maximum flexibility and access to all query metadata.

## Architecture Decision

### What We Keep
- **`src/lib/api.ts`** - Essential infrastructure:
  - `fetchAPI<T>()` - Authenticated fetch wrapper with Clerk token injection
  - `queryKeys` - Centralized query key factory for cache management
  - Type exports - Shared API request/response types
  - `queryClient` - Configured query client instance

### What We Don't Need
- ❌ Generic API wrapper hooks (like `useUpcomingGames()`, `useGame()`, etc.)
- ✅ Components call `useQuery` directly with `fetchAPI` + `queryKeys`

### When to Create Custom Hooks
Only create custom hooks when they add **real business logic**:
- ✅ `useCreatePredictionsFromCart()` - Converts cart selections + shows toasts
- ✅ Domain-specific mutations with side effects
- ❌ Simple query wrappers that just call `fetchAPI`

## Core Pattern: Using Queries

Components import `useQuery` from TanStack Query and use our utilities:

```tsx
import { useQuery } from '@tanstack/react-query'
import { fetchAPI, queryKeys } from '@/lib/api'
import type { GameWithUnifiedOdds } from '@pulse/types'

function UpcomingGamesTable({ league }: { league?: string }) {
  const { data, isLoading, error, isRefetching, isFetching } = useQuery({
    queryKey: queryKeys.games.upcoming(league),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (league) params.append('league', league)
      const query = params.toString()
      return fetchAPI<GameWithUnifiedOdds[]>(`/games/upcoming${query ? `?${query}` : ''}`)
    },
    // Optional: add query options
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  })

  // Full access to all query states
  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  
```tsx
// In your component - define exactly what you need
interface PredictionWithGame {
  id: string
  gameId: string
  type: string
  pick: string
  createdAt: string
  lockedAt: string | null
  game: GameWithUnifiedOdds & {
    result: { homeScore: number; awayScore: number } | null
  }
}

const { data, isLoading } = useQuery({
  queryKey: queryKeys.predictions.history(),
  queryFn: () => fetchAPI<PredictionWithGame[]>('/predictions/history'),
})
```

## When to Create Custom Hooks

Only create hooks for **domain-specific logic**, not simple API wrappers:

```tsx
// ✅ GOOD: Adds real value with business logic
export const useCreatePredictionsFromCart = () => {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (predictions) => fetchAPI('/predictions/batch', { ... }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.predictions.all })
      toast.success('Predictions created!')
    },
  })
  
  return {
    ...mutation,
    mutate: (cartSelections: CartSelection[]) => {
      // Custom conversion logic
      const predictions = cartSelections.map(mapToAPI)
      mutation.mutate(predictions)
    }
  }
}

// ❌ BAD: Just wraps useQuery, adds no value
export const useUpcomingGames = (league?: string) => {
  return useQuery({
    queryKey: queryKeys.games.upcoming(league),
    queryFn: () => fetchAPI('/games/upcoming'),
  })
}
// Components should call useQuery directly instead!
```

## Domain-Specific Hooks

For complex domain logic, use custom hooks in `/hooks`:
```

## Using Mutations in Components

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchAPI, queryKeys, type PredictionInput } from '@/lib/api'

function CreatePrediction() {
  const queryClient = useQueryClient()
  
  const { mutate, isPending, error } = useMutation({
    mutationFn: (prediction: PredictionInput) =>
      fetchAPI('/predictions', {
        method: 'POST',
        body: JSON.stringify(prediction),
      }),
    onSuccess: () => {
      // Invalidate relevant queries to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.predictions.all })
    },
  })

  return (
    <button onClick={() => mutate({ gameId: '123', type: 'MONEYLINE', pick: 'home' })}>
      {isPending ? 'Creating...' : 'Create Prediction'}
    </button>
  )
}
```

## Available Query Keys

All query keys are in `queryKeys` object for consistent caching:

```typescript
queryKeys.games.upcoming(league?)     // Games list
queryKeys.games.byId(id)              // Single game
queryKeys.predictions.dailyStats()    // Daily stats
queryKeys.predictions.pending()       // Pending predictions
queryKeys.predictions.history()       // Prediction history
queryKeys.predictions.byGame()        // Predictions by game
queryKeys.points.me()                 // User points
queryKeys.points.leaderboard(limit?)  // Leaderboard
queryKeys.auth.me()                   // Current user
```

## Benefits of Direct `useQuery` Usage

1. **Full Query Metadata**: Access `isRefetching`, `isFetching`, `dataUpdatedAt`, `fetchStatus`, etc.
2. **Custom Options Per Component**: Set `staleTime`, `cacheTime`, `refetchInterval`, `enabled` as needed
3. **Less Abstraction**: See exactly what's being fetched and how - no magic
4. **Better TypeScript**: Direct type inference without wrapper layers
5. **Flexibility**: Easy to add optimistic updates, dependent queries, parallel queries
6. **Component-Specific Types**: Define types matching exactly what each component needs

## Example: Component-Specific Types

Components can define types that match their exact needs from the API:

```tsx
// usePredictions.ts provides domain-specific logic
import { useCreatePredictionsFromCart } from '@/hooks/usePredictions'

const { mutateAsync, isPending } = useCreatePredictionsFromCart()
await mutateAsync(cartSelections) // Handles conversion automatically
```

## Cache Invalidation

Use `queryClient.invalidateQueries()` to refetch after mutations:

```tsx
const queryClient = useQueryClient()

onSuccess: () => {
  // Invalidate all prediction queries
  queryClient.invalidateQueries({ queryKey: queryKeys.predictions.all })
  
  // Or be more specific
  queryClient.invalidateQueries({ queryKey: queryKeys.predictions.pending() })
}
```
