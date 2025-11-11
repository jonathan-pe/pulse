# Client-Side Migration TODO

This document outlines the changes needed in `apps/web` to complete the migration from tRPC to REST API.

## Files That Need To Be Updated

### 1. Remove tRPC Client Setup

**File:** `apps/web/src/lib/trpc.ts`
- Delete this entire file or replace with a standard HTTP client

### 2. Update Root Route Context

**File:** `apps/web/src/routes/__root.tsx`
- Remove `TRPCOptionsProxy` import
- Remove `trpc` from context type
- Remove `AppRouter` type import from `@pulse/types`

### 3. Update Components Using tRPC

**File:** `apps/web/src/components/games/UpcomingGamesTable.tsx`
- Replace `trpc.games.listUpcoming.queryOptions()` with standard fetch
- Update type imports (remove `inferOutput` from `@trpc/tanstack-react-query`)
- Define types based on API response shape instead of tRPC inference

**Other files to check:**
```bash
grep -r "from '@/lib/trpc'" apps/web/src/
grep -r "trpc\." apps/web/src/
```

## Recommended Approach

### Option 1: Use TanStack Query with Fetch

```typescript
// lib/api.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export async function fetchGames(league?: string, limit?: number) {
  const params = new URLSearchParams()
  if (league) params.append('league', league)
  if (limit) params.append('limit', limit.toString())
  
  const response = await fetch(`${API_BASE_URL}/api/games/upcoming?${params}`)
  if (!response.ok) throw new Error('Failed to fetch games')
  return response.json()
}

// In component
import { useQuery } from '@tanstack/react-query'
import { fetchGames } from '@/lib/api'

const { data, isLoading, error } = useQuery({
  queryKey: ['games', 'upcoming', league],
  queryFn: () => fetchGames(league)
})
```

### Option 2: Use Axios

```typescript
// lib/api.ts
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth interceptor
api.interceptors.request.use(async (config) => {
  const token = await getClerkToken() // Get from Clerk
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const gamesApi = {
  getUpcoming: (league?: string, limit?: number) => 
    api.get('/api/games/upcoming', { params: { league, limit } }),
  getById: (id: string) => 
    api.get(`/api/games/${id}`),
}

export const predictionsApi = {
  create: (data: PredictionInput) => 
    api.post('/api/predictions', data),
  createBatch: (predictions: PredictionInput[]) => 
    api.post('/api/predictions/batch', { predictions }),
  getDailyStats: () => 
    api.get('/api/predictions/daily-stats'),
  // ... etc
}
```

## API Endpoint Mapping

| Old tRPC Call | New REST Endpoint | Method |
|--------------|-------------------|--------|
| `trpc.games.listUpcoming.query()` | `/api/games/upcoming` | GET |
| `trpc.games.byId.query({ id })` | `/api/games/:id` | GET |
| `trpc.predictions.create.mutate()` | `/api/predictions` | POST |
| `trpc.predictions.createBatch.mutate()` | `/api/predictions/batch` | POST |
| `trpc.predictions.dailyStats.query()` | `/api/predictions/daily-stats` | GET |
| `trpc.predictions.myPending.query()` | `/api/predictions/pending` | GET |
| `trpc.predictions.myHistory.query()` | `/api/predictions/history` | GET |
| `trpc.predictions.myPredictedGameIds.query()` | `/api/predictions/game-ids` | GET |
| `trpc.predictions.myPredictionsByGame.query()` | `/api/predictions/by-game` | GET |
| `trpc.points.myPoints.query()` | `/api/points/me` | GET |
| `trpc.points.leaderboard.query()` | `/api/points/leaderboard` | GET |
| `trpc.auth.me.query()` | `/api/auth/me` | GET |

## Type Definitions

Create type definitions for API responses:

```typescript
// types/api.ts
export interface TeamInfo {
  id: string
  code: string
  name: string
  nickname?: string
  city?: string
  logoUrl?: string
  primaryColor?: string
}

export interface GameWithUnifiedOdds {
  id: string
  league: string
  startsAt: Date | string
  homeTeam: TeamInfo
  awayTeam: TeamInfo
  status: string
  odds: UnifiedOdds
  result?: GameResult
}

export interface PredictionInput {
  gameId: string
  type: 'MONEYLINE' | 'SPREAD' | 'TOTAL'
  pick: string
}

// ... etc
```

## Dependencies to Remove

After migration is complete:

```bash
pnpm remove @trpc/client @trpc/tanstack-react-query
```

## Dependencies to Add (if not already present)

```bash
# If using axios
pnpm add axios

# TanStack Query should already be installed
```

## Testing

1. Test each endpoint manually or with integration tests
2. Verify authentication works with Clerk tokens
3. Check error handling for 400/401/404/500 responses
4. Validate response types match expectations

## Notes

- The API now uses standard HTTP status codes
- Query parameters are strings; use `z.coerce.number()` on server if needed
- Authentication uses Clerk session tokens in `Authorization` header
- Error responses are JSON with `{ error: string, details?: any }` format
