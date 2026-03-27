# NatStat Forecasts Integration

## Overview

Pulse now uses NatStat's unified `/forecasts` endpoint to ingest odds data. This endpoint provides **moneyline**, **spread**, and **over/under** odds all in a single API call, making ingestion more efficient and comprehensive.

## Endpoint Details

**Base URL Pattern:**

```text
https://api4.natst.at/{API_KEY}/forecasts/{league}/{date}
```

**Supported Leagues:**

- `pfb` - NFL (Pro Football)
- `nba` - NBA (National Basketball Association)
- `mlb` - MLB (Major League Baseball)
- `nhl` - NHL (National Hockey League)

**Date Format:** `YYYY-MM-DD` (optional, defaults to current day)

## Data Structure

The forecasts endpoint returns a comprehensive response with:

### Game Information

- Team names (home/away)
- Team codes
- Game date/time
- Venue information
- Game status (scheduled, in-progress, final)
- Scores (for completed games)

### Odds Data (per game)

- **Moneyline**: Home and away American odds
- **Spread**: Point spread value (always relative to home team: negative = home favored, positive = home underdog)
- **Over/Under**: Total points line

### Additional Metadata

- ELO ratings (before/after)
- Win expectations
- Simulation predictions (used to determine favorite team for spread normalization)
- Line movement indicators

## Point Spread Normalization

**IMPORTANT**: Pulse stores all point spreads relative to the **home team** for consistency.

### How It Works

1. NatStat provides a spread value (e.g., `-3.5` or `+3.5`)
2. NatStat also provides a `simulation.prediction-favourite-code` indicating which team is favored
3. We compare the favorite team code with the home/away team codes
4. We adjust the spread sign to ensure it's always home-team-relative:
   - **Home team favored**: Spread is negative (e.g., `-7.5` means home gives 7.5 points)
   - **Away team favored**: Spread is positive (e.g., `+3.5` means home gets 3.5 points)

### Examples

**Example 1: Away team favored**

```json
{
  "home": "Jacksonville Jaguars",
  "home-code": "JAX",
  "visitor": "Los Angeles Rams",
  "visitor-code": "LAR",
  "forecast": {
    "spread": { "spread": "-3.5" },
    "simulation": { "prediction-favourite-code": "LAR" }
  }
}
```

- Favorite: LAR (away)
- Stored spread: `+3.5` (home is underdog, gets points)

**Example 2: Home team favored**

```json
{
  "home": "Kansas City Chiefs",
  "home-code": "KCC",
  "visitor": "Las Vegas Raiders",
  "visitor-code": "LVR",
  "forecast": {
    "spread": { "spread": "-11.5" },
    "simulation": { "prediction-favourite-code": "KCC" }
  }
}
```

- Favorite: KCC (home)
- Stored spread: `-11.5` (home is favorite, gives points)

### Database Storage

In the `GameOdds` table:

- `spread` column is **always relative to the home team**
- Negative value: home team is favored
- Positive value: away team is favored (home is underdog)

This ensures consistent interpretation across the entire application without needing to look up which team is which.

## Implementation

### Architecture

```text
apps/api/src/
├── integrators/natstat/
│   ├── client.ts           # API client with loadForecasts()
│   └── normalize.ts        # normalizeForecasts() transforms raw data
├── jobs/
│   └── ingest-natstat.ts   # Orchestration logic
└── routers/
    └── admin.ts            # Admin endpoint for manual/cron triggers
```

### Key Functions

#### `loadForecasts({ league, date })`

Located in `integrators/natstat/client.ts`

Fetches raw forecast data from NatStat API with:

- Automatic authentication header injection
- Retry logic with jittered backoff (one retry on 5xx)
- Rate limit detection (429 handling)
- Configurable timeout

#### `normalizeForecasts(raw, league)`

Located in `integrators/natstat/normalize.ts`

Transforms raw API response into standardized `NormalizedEvent[]` with:

- Unified event identity keys
- League code normalization (PFB → NFL)
- Parsed American odds (moneyline)
- Point spread values
- Over/under totals
- Game status and scores (for completed games)

#### `ingestNatStat({ date, league })`

Located in `jobs/ingest-natstat.ts`

Orchestrates the full ingestion pipeline:

1. Loads forecasts for specified league/date(s)
2. Normalizes the response
3. Upserts `Game` records
4. Upserts `GameOdds` records (keyed by `gameId`, `book`, `market`)
5. Updates `Result` records for completed games
6. Returns comprehensive statistics

## Usage

### Via Admin API Endpoint

**POST** `/admin/ingest-natstat`

**Headers:**

```text
x-cron-token: <CRON_TOKEN>
```

**Body:**

```json
{
  "league": "NFL"
}
```

**Response:**

```json
{
  "ok": true,
  "range": "2025-10-19,2025-10-26",
  "result": {
    "ok": true,
    "counts": {
      "datesProcessed": 7,
      "events": 84,
      "games": 84,
      "oddsLines": 252,
      "scoresUpdated": 12
    }
  }
}
```

### Via CLI

```bash
# Ingest for today (NFL)
pnpm --filter @pulse/api ingest NFL

# Ingest for specific date
pnpm --filter @pulse/api ingest 2025-10-19 NFL

# Ingest for date range
pnpm --filter @pulse/api ingest "2025-10-19,2025-10-26" NFL
```

## Environment Variables

Required configuration in `apps/api/.env`:

```env
# NatStat API Configuration
NATSTAT_BASE_URL=https://api4.natst.at
NATSTAT_API_KEY=your-api-key-here
NATSTAT_AUTH_SCHEME=x-api-key
NATSTAT_TIMEOUT_MS=10000

# Admin Security
CRON_TOKEN=your-secure-token-here
```

## Database Schema

### Game Table

Stores basic game information:

- `league` - Sport league (NFL, NBA, MLB, NHL)
- `startsAt` - Game start time (UTC)
- `homeTeam` - Home team name
- `awayTeam` - Away team name
- `status` - Game status (scheduled, final, etc.)

### GameOdds Table

Stores odds lines with composite unique key `[gameId, book, market]`:

- `gameId` - Foreign key to Game
- `provider` - Always "natstat" for this integration
- `book` - Source identifier (URI or "natstat")
- `market` - One of: "moneyline", "pointspread", "overunder"
- `moneylineHome` / `moneylineAway` - American odds (integers)
- `spread` - Point spread (float, negative = home favored)
- `total` - Over/under line (float)
- `updatedAt` - Last update timestamp

### Result Table

Stores final scores for completed games:

- `gameId` - Unique foreign key to Game
- `homeScore` - Home team final score
- `awayScore` - Away team final score
- `settledAt` - When the result was recorded

## Idempotency

The ingestion process is fully idempotent:

1. **Games**: Matched by unique combination of `(league, startsAt, homeTeam, awayTeam)`
2. **Odds**: Upserted using composite unique key `(gameId, book, market)`
3. **Results**: Upserted using unique `gameId`

Re-running ingestion for the same date/league will:

- Update existing records if values changed
- Skip unchanged records
- Never create duplicates

## Error Handling

### Rate Limiting (429)

When API returns 429, the request fails immediately without retry. The scheduler should handle backoff at the job level.

### Timeout Errors

Requests timeout after `NATSTAT_TIMEOUT_MS` (default 10 seconds). One automatic retry is attempted with jittered backoff (200-800ms).

### Server Errors (5xx)

One automatic retry with jittered backoff. If retry fails, error is logged and ingestion continues to next date.

### Invalid Data

Games with missing required fields (homeTeam, awayTeam, startsAt) are skipped with a warning.

## Scheduling

The admin endpoint processes date ranges (e.g., 2 days before → 2 days after today) in a single call. Recommended schedule:

- **Hourly** during active game hours (08:00-23:00 local)
- **Every 10 minutes** on event days for live updates
- **Daily** overnight for look-ahead ingestion

Example cron expression (every hour during game time):

```text
0 8-23 * * * curl -X POST https://api.pulse.app/admin/ingest-natstat \
  -H "x-cron-token: $CRON_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"league":"NFL"}'
```

## Migration Notes

### Changes from Previous Implementation

**Before:**

- Three separate API calls per ingestion (moneyline, spread, overunder)
- Manual merging of market data by event identity
- No score ingestion capability

**After:**

- Single API call per league/date
- Automatic unification of all markets per game
- Score ingestion for completed games
- More comprehensive metadata (status, venue, ELO)

### Backward Compatibility

The old `loadMarket()` and `normalizeMarket()` functions are retained but deprecated. They will be removed in a future version.

## Testing

To test the integration manually:

```bash
# 1. Set environment variables
export NATSTAT_API_KEY="your-key"
export NATSTAT_BASE_URL="https://api4.natst.at"

# 2. Run ingestion for today
cd apps/api
pnpm tsx src/cli/ingest.ts "$(date +%Y-%m-%d)" NFL

# 3. Verify database records
# Check games were created/updated
# Check odds lines were upserted (3 per game: moneyline, pointspread, overunder)
# Check results were created for completed games
```

## Troubleshooting

### No games returned

- Verify the league code is correct (`pfb` for NFL, not `nfl`)
- Check the date format is YYYY-MM-DD
- Ensure there are actually games scheduled for that league/date

### Authentication errors

- Verify `NATSTAT_API_KEY` is set correctly
- Check `NATSTAT_AUTH_SCHEME` matches your API key type (default: `x-api-key`)

### Missing odds data

- Some games may not have all markets available (especially far in advance)
- Check the raw API response to confirm data is present
- Verify the normalization logic handles the specific response format

### Duplicate games

- Should not happen due to unique constraints
- If duplicates appear, check for inconsistent team name formatting
- Consider adding team code normalization

## Future Enhancements

Potential improvements:

1. **Line History Tracking**: Store odds snapshots over time in an `OddsLineHistory` table
2. **Multi-Provider Support**: Merge odds from multiple sources with best-line selection
3. **Player Props**: Add support for player-specific markets
4. **Live Updates**: WebSocket or polling for in-game odds updates
5. **Circuit Breakers**: Automatic backoff when provider health degrades
6. **Venue Normalization**: Map venue codes to standardized venue names
