# Automatic Game Scoring

This document describes the automatic scoring system that processes completed games and awards points to users based on their predictions.

## Overview

The scoring system operates in three modes:

1. **Auto-Scoring During Ingestion** - Automatically scores games when results are imported from NatStat
2. **Manual Admin Scoring** - Trigger scoring via API endpoints for specific games or all ready games
3. **CLI Batch Scoring** - Run scoring jobs via command line

## How It Works

### Auto-Scoring Flow

When the NatStat ingestion job runs (via cron or CLI), it:

1. Fetches game odds and scores from NatStat API
2. Upserts games and odds into the database
3. **NEW:** If a game has final scores, automatically triggers scoring:
   - Checks if game hasn't been scored yet (`scoredAt` is null)
   - Calls `scoreGameService.scoreCompletedGame(gameId)`
   - Awards points to all predictions on that game
   - Updates user streaks
   - Marks game as scored with timestamp

This eliminates the need for separate manual scoring in most cases.

### Scoring Logic

For each prediction on a completed game:

1. **Determine Correctness:**
   - **Moneyline:** Did user pick the winning team?
   - **Point Spread:** Did the picked team cover the spread?
   - **Over/Under:** Did the total go over/under as predicted?

2. **Calculate Points:**
   ```typescript
   // Base points from odds (probability-based formula)
   impliedProbability = calculateImpliedProbability(odds)
   basePoints = 10 × (100 / impliedProbability)
   
   // Streak bonus (bonus tier only)
   streakBonus = getStreakBonus(userStreak)
   // 2-win: +10, 3-win: +25, 4-win: +50, 5+: +100
   
   totalPoints = basePoints + streakBonus
   ```

3. **Award Points:**
   - Create `PointsLedger` entry
   - Update `User.points`
   - Update `User.currentStreak` (increment on win, reset on loss)
   - Mark prediction as processed

4. **Mark Game Scored:**
   - Set `Result.scoredAt` timestamp to prevent duplicate scoring

## Ingestion Commands

### Current Ingestion (with Auto-Scoring)

```bash
# Ingest today's games (will auto-score any with results)
pnpm --filter @pulse/api ingest NBA

# Ingest specific date
pnpm --filter @pulse/api ingest NBA 2024-01-15

# Ingest date range
pnpm --filter @pulse/api ingest NBA 2024-01-15,2024-01-20
```

### Historical Ingestion (Backfill)

New CLI command to backfill past games with auto-scoring:

```bash
# Ingest yesterday's games
pnpm --filter @pulse/api ingest-historical NBA

# Ingest past 7 days
pnpm --filter @pulse/api ingest-historical NBA 7

# Ingest past month
pnpm --filter @pulse/api ingest-historical NBA 30

# Other leagues
pnpm --filter @pulse/api ingest-historical NFL 14
pnpm --filter @pulse/api ingest-historical MLB 30
pnpm --filter @pulse/api ingest-historical NHL 7
```

## Manual Scoring (Fallback)

If auto-scoring fails or for edge cases:

### Admin API Endpoints

```bash
# Set game result and optionally trigger scoring
POST /api/admin/games/:gameId/results
Authorization: Bearer <ADMIN_API_KEY>
Content-Type: application/json

{
  "homeScore": 110,
  "awayScore": 105,
  "autoScore": true  # Optional: trigger scoring immediately
}

# Score a specific game
POST /api/admin/games/:gameId/score
Authorization: Bearer <ADMIN_API_KEY>

# Score all unscored completed games
POST /api/admin/score-all
Authorization: Bearer <ADMIN_API_KEY>
```

### CLI Commands

```bash
# Score all unscored completed games
pnpm --filter @pulse/api score-games
```

## Cron Schedule Recommendations

### Production Setup

```cron
# Hourly ingestion during active hours (8am-11pm)
0 8-23 * * * curl -X POST https://api.pulse.com/api/admin/ingest \
  -H "Authorization: Bearer $ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"league": "NBA"}'

# More frequent on game days (every 10 minutes)
*/10 18-23 * * 2,4,6,7 curl -X POST https://api.pulse.com/api/admin/ingest \
  -H "Authorization: Bearer $ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"league": "NFL"}'

# Fallback scoring job (runs every 6 hours in case auto-scoring fails)
0 */6 * * * curl -X POST https://api.pulse.com/api/admin/score-all \
  -H "Authorization: Bearer $ADMIN_API_KEY"
```

### Development/Testing

Use manual commands instead of cron:

```bash
# Terminal 1: Run dev server
pnpm dev

# Terminal 2: Trigger ingestion
pnpm --filter @pulse/api ingest NBA

# Terminal 3: Check scoring results
pnpm --filter @pulse/api score-games
```

## Idempotency & Safety

The system is designed to be safe to run multiple times:

- **Games:** Upserted by external ID or deterministic hash
- **Odds:** Upserted by `(gameId, book, market)` composite key
- **Scoring:** Only runs if `Result.scoredAt` is null
- **Points:** Awarded only once per prediction (via `processedAt` timestamp)
- **Errors:** Auto-scoring errors are logged but don't fail ingestion

## Monitoring

Check logs for auto-scoring activity:

```typescript
// Successful auto-scoring
logger.info('Auto-scoring game with result', {
  gameId: 'abc-123',
  homeScore: 110,
  awayScore: 105,
})

logger.info('Game auto-scored during ingestion', {
  gameId: 'abc-123',
  predictionsScored: 42,
  pointsAwarded: 850,
})

// Failed auto-scoring (ingestion continues)
logger.error('Failed to auto-score game during ingestion', error, {
  gameId: 'abc-123',
})
```

## Troubleshooting

### Game Not Auto-Scoring

1. **Check if result exists:**
   ```sql
   SELECT * FROM "Result" WHERE "gameId" = 'abc-123';
   ```

2. **Check if already scored:**
   ```sql
   SELECT "scoredAt" FROM "Result" WHERE "gameId" = 'abc-123';
   ```

3. **Manually trigger scoring:**
   ```bash
   curl -X POST http://localhost:4000/api/admin/games/abc-123/score \
     -H "Authorization: Bearer $ADMIN_API_KEY"
   ```

### Predictions Not Counted

1. **Check prediction state:**
   ```sql
   SELECT id, "userId", pick, "oddsAtPrediction", "bonusTier", "processedAt", "isCorrect"
   FROM "Prediction"
   WHERE "gameId" = 'abc-123';
   ```

2. **Check if odds were captured:**
   - `oddsAtPrediction` should be populated
   - If null, prediction was made before odds capture was implemented

3. **Check points ledger:**
   ```sql
   SELECT * FROM "PointsLedger"
   WHERE "predictionId" IN (
     SELECT id FROM "Prediction" WHERE "gameId" = 'abc-123'
   );
   ```

## Database Schema

Key fields for scoring:

```prisma
model Prediction {
  id              String    @id @default(cuid())
  oddsAtPrediction Json?    // Captured at prediction time
  bonusTier       Boolean   @default(false) // First 5 daily
  processedAt     DateTime? // Scoring timestamp
  isCorrect       Boolean?  // Determined during scoring
}

model Result {
  id         String    @id @default(cuid())
  homeScore  Int
  awayScore  Int
  scoredAt   DateTime? // Prevents duplicate scoring
}

model User {
  currentStreak Int @default(0) // Consecutive correct predictions
}
```

## Testing

### Local Testing Flow

1. **Seed test data:**
   ```bash
   pnpm --filter @pulse/db db:seed
   ```

2. **Make predictions:**
   - Use web UI or API to create predictions

3. **Ingest historical game with result:**
   ```bash
   pnpm --filter @pulse/api ingest-historical NBA 1
   ```

4. **Verify scoring:**
   ```sql
   -- Check predictions were scored
   SELECT COUNT(*) FROM "Prediction" WHERE "processedAt" IS NOT NULL;
   
   -- Check points were awarded
   SELECT SUM(points) FROM "PointsLedger";
   
   -- Check user streaks updated
   SELECT id, points, "currentStreak" FROM "User";
   ```

## Future Enhancements

- [ ] Line movement tracking (historical odds snapshots)
- [ ] Scoring notifications (email/push when points awarded)
- [ ] Leaderboard integration (real-time updates)
- [ ] Advanced streak challenges (7-day, 30-day)
- [ ] Multi-provider best-line selection
