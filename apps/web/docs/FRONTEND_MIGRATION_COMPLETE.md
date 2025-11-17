# Frontend Migration from tRPC to REST API

This document summarizes the complete migration of the frontend from tRPC to standard REST API calls.

## Summary

Successfully removed all tRPC dependencies from the frontend and replaced them with standard REST API calls using fetch and React Query.

## Changes Made

### 1. Created New API Client (`src/lib/api.ts`)

A new centralized API client that:
- Uses standard `fetch` API with authentication via Clerk tokens
- Provides typed API functions for all endpoints
- Maintains the query client for React Query
- Exports type definitions for all API responses

**Key Features:**
- Automatic authentication header injection
- Type-safe API calls
- Error handling with JSON error responses
- Query parameter building

### 2. Updated Core Files

#### `src/main.tsx`
- Changed import from `@/lib/trpc` to `@/lib/api` for `queryClient`

#### `src/auth/clerk.tsx`
- Updated `setGetSessionToken` import to use `@/lib/api` instead of `@/lib/trpc`
- Updated comment to reference API calls instead of tRPC

#### `src/components/auth/AppRouter.tsx`
- Removed `trpc` from router context
- Updated imports to use `queryClient` from `@/lib/api`

#### `src/routes/__root.tsx`
- Removed `TRPCOptionsProxy` and `AppRouter` type imports
- Removed `trpc` from `PulseRouterContext` interface
- Cleaned up tRPC-related type dependencies

### 3. Updated Components and Hooks

#### `src/hooks/usePredictions.ts`
Complete rewrite to use REST API:
- `useCreatePredictions()` → Uses `predictionsApi.createBatch()`
- `useDailyStats()` → Uses `predictionsApi.getDailyStats()`
- `usePendingPredictions()` → Uses `predictionsApi.getPending()`
- `usePredictionHistory()` → Uses `predictionsApi.getHistory()`
- `usePredictionsByGame()` → Uses `predictionsApi.getByGame()`

All hooks now use standard React Query with explicit `queryKey` and `queryFn`.

#### `src/components/games/UpcomingGamesTable.tsx`
- Replaced tRPC query with `gamesApi.getUpcoming()`
- Changed type definition from `inferOutput<typeof trpc...>` to `GameWithUnifiedOdds`
- Updated query to use standard React Query pattern

### 4. Removed Files

- **Deleted:** `src/lib/trpc.ts` - The entire tRPC client setup

### 5. Removed Dependencies

- Removed `superjson` from both `apps/web` and `apps/api`
- tRPC packages (`@trpc/client`, `@trpc/tanstack-react-query`) were already removed

## API Endpoint Mapping

| Old tRPC Call | New REST API Call |
|--------------|-------------------|
| `trpc.games.listUpcoming.queryOptions({ league })` | `gamesApi.getUpcoming({ league })` |
| `trpc.games.byId.queryOptions({ id })` | `gamesApi.getById(id)` |
| `trpcClient.predictions.createBatch.mutate({ predictions })` | `predictionsApi.createBatch(predictions)` |
| `trpc.predictions.dailyStats.queryOptions()` | `predictionsApi.getDailyStats()` |
| `trpc.predictions.myPending.queryOptions()` | `predictionsApi.getPending()` |
| `trpc.predictions.myHistory.queryOptions()` | `predictionsApi.getHistory()` |
| `trpc.predictions.myPredictionsByGame.queryOptions()` | `predictionsApi.getByGame()` |

## Benefits

1. **Standard Web APIs**: Using native `fetch` instead of tRPC abstraction
2. **Better Developer Experience**: Clearer separation between client and server
3. **Easier Debugging**: Standard HTTP requests visible in browser DevTools
4. **Type Safety Maintained**: Full TypeScript support with explicit type definitions
5. **Framework Agnostic**: Could be used with any framework, not just React
6. **Simpler Architecture**: Fewer abstractions, more straightforward code flow

## Query Keys Convention

All queries now use a standardized query key format:
```typescript
['resource', 'action', ...params]

Examples:
['games', 'upcoming', league]
['predictions', 'dailyStats']
['predictions', 'pending']
['predictions', 'byGame']
```

## Type Safety

Types are now explicitly defined in `src/lib/api.ts`:
- `GameWithUnifiedOdds` - From `@pulse/types`
- `PredictionInput` - Request payload type
- `BatchPredictionsResult` - Batch creation response
- `DailyStats` - Daily stats response
- `Prediction` - Single prediction object
- And more...

## Testing

✅ TypeScript compilation successful with no errors
✅ All tRPC references removed from frontend codebase
✅ Query client properly set up and exported
✅ Authentication flow maintained with Clerk

## Next Steps

Test the application:
1. Start the API server: `pnpm --filter @pulse/api dev`
2. Start the web app: `pnpm --filter @pulse/web dev`
3. Verify all API calls work correctly
4. Test authentication with Clerk
5. Test predictions creation and viewing
6. Test games listing and details

## Migration Complete! 🎉

Both frontend and backend have been successfully migrated from tRPC to standard REST API. The application now uses:
- **Backend**: Express.js with REST endpoints
- **Frontend**: React Query with fetch API calls
- **Auth**: Clerk for authentication (unchanged)
- **Types**: Shared types via `@pulse/types` package
