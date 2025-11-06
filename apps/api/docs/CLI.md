# Pulse API CLI Commands

## Ingest Command

Run NatStat odds and game data ingestion manually.

### Usage

```bash
pnpm --filter @pulse/api ingest [date] <league>

# Or from the apps/api directory:
cd apps/api
pnpm ingest [date] <league>
```

### Arguments

- **`date`** (optional) - Date or date range for ingestion
  - Single date: `YYYY-MM-DD` (e.g., `2025-10-19`)
  - Date range: `YYYY-MM-DD,YYYY-MM-DD` (e.g., `2025-10-19,2025-10-26`)
  - If omitted, defaults to today's date

- **`league`** (required) - Sport league code
  - `NFL` - National Football League
  - `NBA` - National Basketball Association
  - `MLB` - Major League Baseball
  - `NHL` - National Hockey League

### Examples

#### Ingest today's games for NFL

```bash
pnpm --filter @pulse/api ingest NFL
```

#### Ingest specific date

```bash
pnpm --filter @pulse/api ingest 2025-10-19 NFL
```

#### Ingest date range (7 days)

```bash
pnpm --filter @pulse/api ingest "2025-10-19,2025-10-26" NFL
```

#### Ingest multiple leagues (run separately)

```bash
pnpm --filter @pulse/api ingest NFL
pnpm --filter @pulse/api ingest NBA
pnpm --filter @pulse/api ingest MLB
pnpm --filter @pulse/api ingest NHL
```

### Output

The command outputs a JSON summary with:

```json
{
  "ok": true,
  "counts": {
    "datesProcessed": 7,
    "events": 84,
    "games": 84,
    "oddsLines": 252,
    "scoresUpdated": 12
  },
  "details": [
    {
      "identity": "...",
      "gameId": "...",
      "oddsUpserted": 3,
      "scoresUpdated": false
    }
  ]
}
```

### Environment Variables

Required in `.env`:

```env
NATSTAT_BASE_URL=https://api3.natst.at
NATSTAT_API_KEY=your-api-key-here
NATSTAT_AUTH_SCHEME=x-api-key
NATSTAT_TIMEOUT_MS=10000
DATABASE_URL=postgresql://...
```

### Common Use Cases

#### Daily morning ingestion

Run before peak prediction hours to load the day's games:

```bash
pnpm --filter @pulse/api ingest NFL
```

#### Weekly lookahead

Load the next 7 days of games on Monday morning:

```bash
TODAY=$(date +%Y-%m-%d)
WEEK_OUT=$(date -v+7d +%Y-%m-%d)  # macOS
# WEEK_OUT=$(date -d "+7 days" +%Y-%m-%d)  # Linux

pnpm --filter @pulse/api ingest "$TODAY,$WEEK_OUT" NFL
```

#### Post-game score updates

After games complete, re-run to capture final scores:

```bash
pnpm --filter @pulse/api ingest 2025-10-19 NFL
```

### Error Handling

The command will:

- Exit with code `1` on failure
- Print error details to stderr
- Continue processing remaining dates if one date fails

Example error output:

```text
Ingestion failed:
Error: League is required for NatStat forecasts ingestion
```

### Troubleshooting

#### "League is required" error

Make sure to provide the league as the last argument:

```bash
# ❌ Wrong
pnpm --filter @pulse/api ingest 2025-10-19

# ✅ Correct
pnpm --filter @pulse/api ingest 2025-10-19 NFL
```

#### "No games returned"

- Verify the league code is correct (case matters: use `NFL` not `nfl`)
- Check that games are actually scheduled for that date
- Confirm your NatStat API key has access to that league

#### Database connection errors

- Verify `DATABASE_URL` is set in `.env`
- Ensure the database is running
- Check that migrations have been applied

### Testing

Test with a known date that has completed games:

```bash
# Should return games with scores
pnpm --filter @pulse/api ingest 2025-10-19 NFL
```

Verify in the database:

```sql
-- Check games were created
SELECT * FROM "Game" WHERE league = 'NFL' AND "startsAt"::date = '2025-10-19';

-- Check odds were created (should be 3 per game: moneyline, pointspread, overunder)
SELECT g.*, COUNT(o.*) as odds_count
FROM "Game" g
LEFT JOIN "GameOdds" o ON o."gameId" = g.id
WHERE g.league = 'NFL' AND g."startsAt"::date = '2025-10-19'
GROUP BY g.id;

-- Check scores were recorded for completed games
SELECT g.*, r.*
FROM "Game" g
LEFT JOIN "Result" r ON r."gameId" = g.id
WHERE g.league = 'NFL' AND g.status = 'Final' AND g."startsAt"::date = '2025-10-19';
```

## Sync Teams Command

Synchronize team metadata from NatStat and enrich with badge/logo URLs from TheSportsDB.

### Usage

```bash
pnpm --filter @pulse/api sync-teams <league>

# Or from the apps/api directory:
cd apps/api
pnpm sync-teams <league>
```

### Arguments

- **`league`** (required) - Sport league code
  - `NFL` - National Football League
  - `NBA` - National Basketball Association
  - `MLB` - Major League Baseball
  - `NHL` - National Hockey League

### Examples

#### Sync NFL teams

```bash
pnpm --filter @pulse/api sync-teams NFL
```

#### Sync all leagues

```bash
pnpm --filter @pulse/api sync-teams NFL
pnpm --filter @pulse/api sync-teams NBA
pnpm --filter @pulse/api sync-teams MLB
pnpm --filter @pulse/api sync-teams NHL
```

### Output

The command outputs a JSON summary with:

```json
{
  "ok": true,
  "league": "NFL",
  "teamsProcessed": 32,
  "teamsEnriched": 32
}
```

### Environment Variables

Required in `.env`:

```env
NATSTAT_BASE_URL=https://api3.natst.at
NATSTAT_API_KEY=your-api-key-here
THESPORTSDB_BASE_URL=https://www.thesportsdb.com/api/v1/json
THESPORTSDB_API_KEY=123
DATABASE_URL=postgresql://...
```

### What It Does

1. Fetches all teams for the specified league from NatStat
2. For each team, queries TheSportsDB to find matching team metadata
3. Extracts badge and logo URLs from TheSportsDB
4. Upserts team data into the `NatStatTeam` table with enriched metadata

### Common Use Cases

#### Initial setup

Run once per league to populate team metadata:

```bash
pnpm --filter @pulse/api sync-teams NFL
```

#### Refresh team data

Re-run periodically to update team metadata (e.g., if logos change):

```bash
pnpm --filter @pulse/api sync-teams NFL
```

#### New season preparation

Sync all leagues before a new season starts:

```bash
for league in NFL NBA MLB NHL; do
  pnpm --filter @pulse/api sync-teams $league
done
```

## Future CLI Commands

Planned additions:

- `pnpm settle-predictions` - Settle predictions for completed games
- `pnpm cleanup-old-games` - Archive old games and predictions
- `pnpm sync-user-data` - Sync user profiles from Clerk
