# API Types

This directory contains TypeScript types for API requests and responses.

## Philosophy

**Base types, not complete types.** The types here represent the minimal contract between frontend and backend. Components should define their own types based on what they actually need from each endpoint.

### Why?

Different API endpoints return different shapes:
- `/predictions/history` returns predictions with full nested game data
- `/predictions/pending` returns predictions with minimal game info  
- `/predictions/by-game` returns a grouped object, not an array

Rather than trying to capture every possible shape in one type, we provide:
1. **Base types** for common entities
2. **Request/Response types** for mutations
3. **Documentation** on what to expect

## Usage Pattern

### ❌ Don't: Use incomplete shared types
```tsx
import { Prediction } from '@/types/api'

// This will fail because Prediction doesn't include 'game'
const { data } = useQuery<Prediction[]>(...)
console.log(data[0].game.homeTeam) // Error!
```

### ✅ Do: Define component-specific types
```tsx
import { BasePrediction } from '@/types/api'
import type { GameWithUnifiedOdds } from '@pulse/types'

// Define exactly what this component needs
interface PredictionWithGame extends BasePrediction {
  game: GameWithUnifiedOdds & {
    result: { homeScore: number; awayScore: number } | null
  }
}

const { data } = useQuery({
  queryKey: queryKeys.predictions.history(),
  queryFn: () => fetchAPI<PredictionWithGame[]>('/predictions/history')
})
```

## When to Add Types Here

Add types to `api.ts` when they're:
1. **Request types** - Used in POST/PUT bodies (e.g., `PredictionInput`)
2. **Standard response types** - Consistent across endpoints (e.g., `DailyStats`)
3. **Base types** - Can be extended by components (e.g., `BasePrediction`)

## When NOT to Add Types Here

Don't add types when:
- They're specific to one component's needs
- They include nested/joined data that varies by endpoint
- They'll conflict with existing types

Instead, define them inline where they're used.
