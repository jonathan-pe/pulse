# ADR-006: Point Spread Normalization and Storage

## Status

**Accepted** - Implemented on 2025

## Context

Point spread data from NatStat's `/forecasts` endpoint arrives without explicit indication of which team the spread applies to. NatStat provides:
- A numeric spread value (e.g., `-3.5` or `+3.5`)
- A `spread.favourite` field containing a NatStat team ID
- Team codes for home/away teams (e.g., "JAX", "KCC")

Without proper normalization, the spread values would be ambiguous:
- Does `-7.5` mean home gives or receives points?
- How do we consistently display spreads to users?
- How do we evaluate predictions when games complete?

### Problem Statement

We need to:
1. Store all spreads consistently relative to the home team
2. Establish convention: **negative = home favored** (gives points), **positive = home underdog** (receives points)
3. Map NatStat team IDs to team codes to determine favorite
4. Cache team mappings to avoid repeated API calls during ingestion

### Decision Drivers

- Need deterministic spread interpretation for scoring
- Want consistent UI display (always show from home team perspective)
- Require team ID lookups without per-game API overhead
- Must support multiple leagues with different team sets

## Decision

Implement point spread normalization system with three components:

1. **NatStatTeam table** - Cache team ID-to-code mappings in database
2. **Team sync job** - Populate cache from NatStat `/teamcodes` endpoint
3. **Spread adjustment logic** - Use favorite team ID to determine correct spread sign

### Normalization Rules

```
IF home team is favorite:
  spread = negative (home gives points)
ELSE IF away team is favorite:
  spread = positive (home receives points)
```

### Implementation Flow

```
1. Sync teams: NatStat API → NatStatTeam table (weekly/monthly)
2. Load teams: Database → Map<teamId, teamCode>
3. Ingest forecasts: API → normalizeForecasts() → events with spreadFavouriteId
4. Adjust spreads: adjustSpreadSigns(events, teamMap) → normalized spreads
5. Store games: Upsert with home-relative spreads
```

## Consequences

### Positive

- ✅ **Deterministic spread interpretation** - Always home-team-relative
- ✅ **Cached team lookups** - No per-game API overhead
- ✅ **Consistent UI display** - Users see spreads from home perspective
- ✅ **Accurate scoring** - Prediction evaluation unambiguous
- ✅ **Multi-league support** - Single pattern works for all sports
- ✅ **Recoverable from bad data** - Re-sync teams if mappings incorrect

### Negative

- ⚠️ **New database table** - Adds schema complexity
- ⚠️ **Team sync dependency** - Must run before first ingestion
- ⚠️ **Stale data risk** - Team changes require re-sync
- ⚠️ **Additional job** - One more scheduled task to maintain

### Neutral

- 📋 **Infrequent updates** - Teams change rarely (monthly sync sufficient)
- 📋 **Small data volume** - ~150 teams across all leagues
- 📋 **Backward compatible** - No changes to Game/GameOdds schema

## Implementation Details

### 1. Database Schema (`packages/db/prisma/schema/natstat.prisma`)

Created a new table to cache NatStat team data:

```prisma
model NatStatTeam {
  id        String   @id // NatStat team ID (e.g., "2022531")
  code      String   // Team code (e.g., "JAX")
  name      String   // Team name (e.g., "Jacksonville Jaguars")
  league    String   // League (e.g., "NFL")
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([league, code])
  @@index([league, active])
}
```

### 2. API Client (`apps/api/src/integrators/natstat/client.ts`)

Added function to fetch team codes from NatStat:

```typescript
export async function loadTeamCodes({ league }: { league: string }): Promise<any> {
  const url = `${NATSTAT_BASE_URL}/${NATSTAT_API_KEY}/teamcodes/${league.toLowerCase()}`
  const json = await fetchWithRetry(url, { method: 'GET' })
  return json
}
```

### 3. Team Sync Job (`apps/api/src/jobs/sync-natstat-teams.ts`)

New job to populate/update the `NatStatTeam` table:

- Fetches team codes from `/teamcodes` endpoint
- Upserts teams into database
- Should be run weekly or monthly (teams rarely change)

### 4. Normalization (`apps/api/src/integrators/natstat/normalize.ts`)

Updated `NormalizedEvent` type to include:

- `homeTeamCode` - Home team code from forecast data
- `awayTeamCode` - Away team code from forecast data
- `spreadFavouriteId` - NatStat team ID of favorite (temporary, for processing)

Added `adjustSpreadSigns()` helper function:

```typescript
export function adjustSpreadSigns(
  events: NormalizedEvent[],
  teamIdToCode: Map<string, string>
): NormalizedEvent[]
```

This function:

1. Looks up the favorite team's code using `spreadFavouriteId`
2. Compares it to home/away team codes
3. Adjusts spread sign:
   - Home is favorite → negative spread
   - Away is favorite → positive spread (home is underdog)
4. Removes `spreadFavouriteId` from final output

### 5. Ingestion Job (`apps/api/src/jobs/ingest-natstat.ts`)

Updated to:

1. Load team ID-to-code mappings from database
2. Call `adjustSpreadSigns()` after normalization
3. Store properly signed spreads in database

## Setup Instructions

### 1. Generate Prisma Client

```bash
cd packages/db
pnpm prisma generate
```

### 2. Create Migration

```bash
cd packages/db
pnpm prisma migrate dev --name add_natstat_teams
```

### 3. Sync Team Data

For each league you want to ingest:

```bash
# Add CLI command for team sync
pnpm --filter @pulse/api sync-teams NFL
pnpm --filter @pulse/api sync-teams NBA
pnpm --filter @pulse/api sync-teams MLB
pnpm --filter @pulse/api sync-teams NHL
```

### 4. Update package.json

Add new CLI command:

```json
{
  "scripts": {
    "sync-teams": "tsx src/cli/sync-teams.ts"
  }
}
```

### 5. Create CLI Script

File: `apps/api/src/cli/sync-teams.ts`

```typescript
#!/usr/bin/env node
import 'dotenv/config'
import { syncNatStatTeams } from '../jobs/sync-natstat-teams.js'

async function main() {
  const league = process.argv[2]

  if (!league) {
    console.error('Usage: pnpm sync-teams <league>')
    console.error('  league: Required. One of: NFL, NBA, MLB, NHL')
    process.exit(1)
  }

  console.log(`Syncing NatStat teams for ${league}...`)
  const res = await syncNatStatTeams({ league })
  console.log(JSON.stringify(res, null, 2))
}

main().catch((err) => {
  console.error('Team sync failed:')
  console.error(err)
  process.exit(1)
})
```

## Testing

### 1. Sync Teams

```bash
pnpm --filter @pulse/api sync-teams NFL
```

Expected output:

```json
{
  "ok": true,
  "league": "NFL",
  "counts": {
    "total": 84,
    "created": 84,
    "updated": 0,
    "skipped": 0
  }
}
```

### 2. Verify Database

```sql
SELECT * FROM "NatStatTeam" WHERE league = 'NFL' AND active = true LIMIT 10;
```

Should show teams like:

- `2022531` | `JAX` | Jacksonville Jaguars
- `2022514` | `ARZ` | Arizona Cardinals
- etc.

### 3. Run Ingestion

```bash
pnpm --filter @pulse/api ingest 2025-10-19 NFL
```

### 4. Verify Spreads

```sql
SELECT 
  g."homeTeam",
  g."awayTeam",
  o.spread,
  CASE 
    WHEN o.spread < 0 THEN g."homeTeam" || ' is favored'
    WHEN o.spread > 0 THEN g."awayTeam" || ' is favored'
    ELSE 'Pick em'
  END as favorite
FROM "Game" g
JOIN "GameOdds" o ON o."gameId" = g.id
WHERE g.league = 'NFL' 
  AND g."startsAt"::date = '2025-10-19'
  AND o.market = 'pointspread';
```

Expected results:

- Spreads should be negative when home team is favored
- Spreads should be positive when away team is favored

## Example Data Flow

### Input (from NatStat)

```json
{
  "forecast_17118": {
    "home": "Jacksonville Jaguars",
    "home-code": "JAX",
    "visitor": "Los Angeles Rams",
    "visitor-code": "LAR",
    "forecast": {
      "spread": {
        "spread": "-3.5",
        "favourite": "2022531"  // JAX team ID
      }
    }
  }
}
```

### Team Lookup

```javascript
teamIdToCode.get("2022531") → "JAX"
```

### Spread Adjustment

```typescript
// favouriteCode = "JAX"
// homeCode = "JAX"
// homeIsFavorite = true
// → spread = -3.5 (home is favored, keep negative)
```

### Database Storage

```sql
INSERT INTO "GameOdds" (spread) VALUES (-3.5);
-- Negative spread = home team (Jacksonville) is favored by 3.5 points
```

## Maintenance

### Weekly Team Sync (Recommended)

Set up a cron job or scheduled task:

```bash
# Every Monday at 2 AM
0 2 * * 1 pnpm --filter @pulse/api sync-teams NFL
0 2 * * 1 pnpm --filter @pulse/api sync-teams NBA
0 2 * * 1 pnpm --filter @pulse/api sync-teams MLB
0 2 * * 1 pnpm --filter @pulse/api sync-teams NHL
```

### When Teams Change

Teams rarely change during a season, but when they do:

- Team relocations (e.g., Raiders → Las Vegas)
- Team name changes (e.g., Washington Redskins → Commanders)
- Expansion teams

Run sync immediately after such changes are announced.

## Future Enhancements

1. **Cache invalidation**: Add `lastSyncedAt` to track when teams were last updated
2. **Auto-sync**: Trigger team sync automatically if data is stale (> 7 days old)
3. **Team aliases**: Handle team name variations and historical names
4. **Multi-league**: Optimize to sync all leagues in one job
5. **Validation**: Add spread validation logic to catch data quality issues
