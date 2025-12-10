# @pulse/shared

Shared utilities, constants, and business logic used across API and web applications.

## Purpose

This package contains code that must remain synchronized between frontend and backend:
- **Points calculation** - Ensures frontend previews match backend scoring
- **Business constants** - Single source of truth for limits and multipliers
- **Formatting utilities** - Consistent data presentation

## Design Philosophy: Future-Proof for Dynamic Configuration

All constants in this package are **DEFAULT** values designed to be overridable:

```typescript
// Frontend: Shows users what's typical
import { DAILY_BONUS_TIER_LIMIT } from '@pulse/shared'

// Backend: Can override with runtime config
const limit = await configService.getDailyBonusTierLimit() 
// Falls back to DEFAULT_DAILY_BONUS_TIER_LIMIT if no override exists
```

### Migration to Dynamic Config (Future)

When you build an admin panel for runtime configuration:

1. **Database layer**: Add `Config` table for admin-set values
2. **Config service**: Create `ConfigService` that checks DB → Env → Defaults
3. **No breaking changes**: Existing imports continue working as defaults
4. **Gradual migration**: Move constants to DB-backed config one-by-one

The shared package becomes your "sensible defaults" library, not a constraint.

## What Belongs Here

✅ **Add to this package:**
- Pure calculation functions (no side effects)
- Business rule constants that must match between apps
- Formatting utilities used in multiple places
- Validation logic shared across boundaries

❌ **Keep separate:**
- Database operations (API only)
- React components/hooks (web only)
- Environment-specific configuration
- API routes or middleware

## Usage

```typescript
// Import calculations
import { 
  calculateBasePoints, 
  calculateImpliedProbability,
  calculatePointsForOutcome 
} from '@pulse/shared'

// Import constants
import { 
  DEFAULT_DAILY_BONUS_TIER_LIMIT,
  DEFAULT_DAILY_TOTAL_LIMIT,
  DEFAULT_BONUS_TIER_MULTIPLIER 
} from '@pulse/shared'

// Import formatting
import { formatOdds, getLeagueBadgeColor } from '@pulse/shared'
```

## Exports

- `constants.ts` - Business rule defaults (limits, multipliers)
- `points.ts` - Points calculation functions
- `formatting.ts` - Display formatting utilities
- `index.ts` - Main entry point (re-exports all)
