# tRPC to Express Migration - Server Side

This document summarizes the migration from tRPC to a standard Express REST API on the server side.

## What Was Changed

### Files Modified

1. **`src/index.ts`**
   - Removed tRPC Express adapter middleware
   - Removed imports for `@trpc/server/adapters/express`, `appRouter`, and `createContext`
   - Removed `/trpc` route mounting
   - Removed `AppRouter` type export

2. **`src/expressRouter.ts`**
   - Added new Express routers for: auth, games, predictions, points
   - Mounted them at `/api/*` paths

3. **`src/routers/auth.ts`**
   - Converted from tRPC router to Express router
   - Changed from `protectedProcedure` to standard Express middleware with `getAuth()`
   - Endpoint: `GET /api/auth/me`

4. **`src/routers/games.ts`**
   - Converted from tRPC router to Express router
   - Changed procedures to standard GET endpoints
   - Endpoints:
     - `GET /api/games/upcoming` (with query params: `league`, `limit`)
     - `GET /api/games/:id`
   - Added Zod validation for query parameters
   - Added error handling for 400/404/500 responses

5. **`src/routers/predictions.ts`**
   - Converted from tRPC router to Express router
   - Changed mutations to POST endpoints and queries to GET endpoints
   - Endpoints:
     - `POST /api/predictions` - Create single prediction
     - `POST /api/predictions/batch` - Create multiple predictions
     - `GET /api/predictions/daily-stats`
     - `GET /api/predictions/pending`
     - `GET /api/predictions/history`
     - `GET /api/predictions/game-ids`
     - `GET /api/predictions/by-game`
   - Added request body validation with Zod
   - Replaced `TRPCError` with standard HTTP error responses

6. **`src/routers/points.ts`**
   - Converted from tRPC router to Express router
   - Endpoints:
     - `GET /api/points/me` - Get current user's points
     - `GET /api/points/leaderboard` - Get leaderboard (with query param: `limit`)
   - Added Zod validation for query parameters

7. **`src/routers/health.ts`**
   - Removed tRPC version (`trpcHealthRouter`)
   - Kept only Express version
   - Renamed from `expressHealthRouter` to `healthRouter`

### Files Deleted

1. **`src/trpc.ts`** - tRPC initialization and context setup
2. **`src/trpcRouter.ts`** - tRPC app router composition

### Dependencies

No package.json changes were needed as tRPC packages were already removed from dependencies.

## API Changes

### Before (tRPC)
```typescript
// Client usage
const games = await trpc.games.listUpcoming.query({ league: 'MLB' })
const prediction = await trpc.predictions.create.mutate({ 
  gameId: '123', 
  type: 'MONEYLINE', 
  pick: 'HOME' 
})
```

### After (Express REST)
```typescript
// Client usage
const games = await fetch('/api/games/upcoming?league=MLB')
const prediction = await fetch('/api/predictions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ gameId: '123', type: 'MONEYLINE', pick: 'HOME' })
})
```

## Authentication

Authentication remains the same using Clerk:
- `getAuth(req)` is used to extract the user ID from the request
- Protected endpoints return 401 if no user is authenticated
- Clerk middleware is still mounted globally in `index.ts`

## Error Handling

- **400 Bad Request**: Invalid input (Zod validation errors)
- **401 Unauthorized**: Missing or invalid authentication
- **404 Not Found**: Resource not found (e.g., game by ID)
- **500 Internal Server Error**: Unexpected errors

## Validation

Zod schemas are still used for input validation, but applied at the Express route level:
- Query parameters: Use `z.coerce.number()` for numeric query params (strings by default)
- Request bodies: Use standard Zod schemas with `.parse()`

## Next Steps (Client Side)

The frontend (`apps/web`) still needs to be updated to:
1. Remove tRPC client setup
2. Replace tRPC hooks with standard fetch/axios calls or a REST API client
3. Update all query and mutation calls to use the new REST endpoints
4. Handle the new response format (no tRPC wrapper)

## Benefits

1. **Simpler stack**: Standard REST API without tRPC abstraction
2. **Better compatibility**: Works with any HTTP client
3. **Standard conventions**: HTTP methods, status codes, and REST patterns
4. **Easier debugging**: Standard request/response cycle
5. **Better documentation**: Can use OpenAPI/Swagger if needed

## Testing

Services remain unchanged, so existing service tests should continue to work. Router-level tests would need to be updated to test Express endpoints instead of tRPC procedures.
