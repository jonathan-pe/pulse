# ADR-001: Automatic Game Scoring Implementation

## Status

**Accepted** - Implemented on 2025

## Context

Pulse required manual admin intervention to score completed games and award points to users. This created operational overhead and delayed user feedback, as predictions couldn't be automatically resolved when games finished. The NatStat API provides game results as part of the ingestion flow, making it possible to trigger scoring automatically when results become available.

### Problem Statement

- Manual scoring required admin action for every completed game
- Users experienced delays in seeing prediction results
- Risk of human error or missed games in manual processes
- No automated workflow for historical data backfill

## Decision

Implement automatic game scoring triggered during NatStat ingestion when completed games with results are detected. The system will:

1. **Auto-score during ingestion** - Check for game results after upserting scores, trigger scoring if `scoredAt` is null
2. **Create historical ingestion CLI** - Enable backfilling past games for testing and data recovery
3. **Maintain safety guarantees** - Wrap auto-scoring in error handling to prevent ingestion failures
4. **Preserve idempotency** - Only score games once using `Result.scoredAt` timestamp

### Implementation Components

### 1. Auto-Scoring During Ingestion (`apps/api/src/jobs/ingest-natstat.ts`)

**Changes:**
- Added `scoreGameService` import
- Track `scoredGameIds` during ingestion
- After upserting game scores, automatically trigger scoring if:
  - Game has `homeScore` and `awayScore`
  - Result record exists in database
  - Result hasn't been scored yet (`scoredAt` is null)
- Wrap scoring in try-catch to prevent ingestion failures
- Include `gamesScored` count in job results

**Behavior:**
```typescript
// When scores are detected during ingestion:
if (scoresUpdated || (ev.homeScore !== undefined && ev.awayScore !== undefined)) {
  const gameWithResult = await prisma.game.findUnique({
    where: { id: game.id },
    include: { result: true },
  })

  if (gameWithResult?.result && !gameWithResult.result.scoredAt) {
    const scoringResult = await scoreGameService.scoreCompletedGame(game.id)
    // Awards points, updates streaks, marks game as scored
  }
}
```

### 2. Historical Ingestion CLI (`apps/api/src/cli/ingest-historical.ts`)

**Purpose:** Backfill past games with auto-scoring for historical data or testing.

**Usage:**
```bash
# Ingest yesterday's games
pnpm --filter @pulse/api ingest-historical NBA

# Ingest past 7 days
pnpm --filter @pulse/api ingest-historical NBA 7

# Ingest past month
pnpm --filter @pulse/api ingest-historical MLB 30
```

**Features:**
- Accepts league and number of days back
- Processes each date sequentially
- Reports total games scored and scores updated
- Added to `package.json` scripts as `ingest-historical`

### 3. Comprehensive Documentation (`apps/api/docs/AUTO_SCORING.md`)

**Covers:**
- How auto-scoring works during ingestion
- Scoring logic and point calculation formulas
- CLI commands for ingestion and historical backfill
- Manual scoring fallbacks (admin endpoints + CLI)
- Recommended cron schedules for production
- Idempotency and safety guarantees
- Monitoring and troubleshooting guides
- Database schema overview
- Testing workflows

### 4. Test Fixes

Updated `apps/api/src/services/__tests__/games.service.test.ts`:
- Added `scoredAt: null` to all Result mock objects
- Fixed TypeScript compilation errors

## Consequences

### Positive

- ✅ **Eliminated manual intervention** - Games score automatically when results arrive
- ✅ **Faster user feedback** - Predictions resolved within minutes of game completion
- ✅ **Reduced operational overhead** - No admin action required for routine scoring
- ✅ **Historical backfill capability** - CLI tool enables recovery and testing scenarios
- ✅ **Maintained reliability** - Auto-scoring errors don't break ingestion pipeline
- ✅ **Preserved idempotency** - Safe to re-run ingestion without duplicate point awards

### Negative

- ⚠️ **Hidden complexity** - Scoring logic now triggered in multiple places (ingestion + manual)
- ⚠️ **Debugging challenges** - Need to check both ingestion logs and scoring logs
- ⚠️ **Potential silent failures** - Auto-scoring errors logged but don't fail ingestion

### Neutral

- 📋 **Monitoring required** - Need to track auto-scoring success rates
- 📋 **Fallback still needed** - Manual scoring endpoints preserved for edge cases
- 📋 **Testing complexity** - Must verify both automatic and manual scoring paths

## Implementation Details

### Ingestion Flow

```
1. NatStat API returns game data with scores
   ↓
2. Normalize forecasts → NormalizedEvent with homeScore/awayScore
   ↓
3. Upsert Game and GameOdds records
   ↓
4. Upsert Result record (gamesService.upsertGameScores)
   ↓
5. **NEW:** Auto-score if result exists and not yet scored
   - Call scoreGameService.scoreCompletedGame(gameId)
   - Process all predictions on that game
   - Award points based on correctness
   - Update user streaks
   - Mark game as scored (Result.scoredAt)
```

### Scoring Logic

For each prediction:
1. **Determine correctness** (moneyline/spread/total)
2. **Calculate points:**
   - Base: `10 × (100 / ImpliedProbability)`
   - Streak bonus (bonus tier): 10/25/50/100 points
3. **Award points** to user
4. **Update streak** (increment or reset)
5. **Mark processed** (`prediction.processedAt`)

## Safety & Idempotency

✅ **Safe to run multiple times:**
- Games: Upserted by external ID or hash
- Odds: Upserted by `(gameId, book, market)` key
- Results: Upserted by `gameId`
- **Scoring: Only runs if `Result.scoredAt` is null**
- Points: Only awarded if `prediction.processedAt` is null

✅ **Error isolation:**
- Auto-scoring errors are logged but don't fail ingestion
- Each prediction scoring is wrapped in try-catch
- Failed predictions are tracked and reported

## Production Deployment

### Recommended Cron Schedule

```bash
# Hourly ingestion during active hours (8am-11pm ET)
0 8-23 * * * curl -X POST https://api.pulse.com/api/admin/ingest \
  -H "Authorization: Bearer $ADMIN_API_KEY" \
  -d '{"league": "NBA", "date": "today"}'

# Increase frequency on game days (every 10 minutes, 6pm-11pm)
*/10 18-23 * * 2,4,6,7 curl -X POST https://api.pulse.com/api/admin/ingest \
  -H "Authorization: Bearer $ADMIN_API_KEY" \
  -d '{"league": "NFL", "date": "today"}'

# Fallback scoring (every 6 hours, in case auto-scoring fails)
0 */6 * * * curl -X POST https://api.pulse.com/api/admin/score-all \
  -H "Authorization: Bearer $ADMIN_API_KEY"
```

### Backfill Historical Data

Before going live, backfill recent games:

```bash
# Backfill last 30 days of each league
pnpm --filter @pulse/api ingest-historical NBA 30
pnpm --filter @pulse/api ingest-historical NFL 30
pnpm --filter @pulse/api ingest-historical MLB 30
pnpm --filter @pulse/api ingest-historical NHL 30
```

## Testing

### Local Testing Workflow

```bash
# 1. Start dev server
pnpm dev

# 2. In another terminal, ingest yesterday's games
pnpm --filter @pulse/api ingest-historical NBA 1

# 3. Check results
# - View logs for "Game auto-scored during ingestion"
# - Query database to verify predictions were scored
# - Check user points and streaks updated
```

### Verification Queries

```sql
-- Check how many games have been scored
SELECT COUNT(*) FROM "Result" WHERE "scoredAt" IS NOT NULL;

-- Check predictions scored today
SELECT COUNT(*) FROM "Prediction" 
WHERE "processedAt" IS NOT NULL 
  AND "processedAt" > NOW() - INTERVAL '1 day';

-- Check points awarded today
SELECT SUM(delta) FROM "PointsLedger"
WHERE "createdAt" > NOW() - INTERVAL '1 day';

-- Check user streaks
SELECT id, email, points, "currentStreak" 
FROM "User" 
WHERE "currentStreak" > 0
ORDER BY "currentStreak" DESC;
```

## Files Modified

### New Files
- `apps/api/src/cli/ingest-historical.ts` - Historical backfill CLI
- `apps/api/docs/AUTO_SCORING.md` - Comprehensive documentation

### Modified Files
- `apps/api/src/jobs/ingest-natstat.ts` - Added auto-scoring logic
- `apps/api/package.json` - Added `ingest-historical` script
- `apps/api/src/services/__tests__/games.service.test.ts` - Fixed test mocks
- `apps/api/src/services/score-game.service.ts` - Fixed logger type issue

## Monitoring

Look for these log messages:

### Successful Auto-Scoring
```
[INFO] Auto-scoring game with result { gameId, homeScore, awayScore }
[INFO] Game auto-scored during ingestion { gameId, predictionsScored, pointsAwarded }
```

### Errors (Non-Fatal)
```
[ERROR] Failed to auto-score game during ingestion { gameId }
```

### Ingestion Summary
```
✅ Historical Ingestion Summary:
   League: NBA
   Days Processed: 7
   Game Scores Updated: 45
   Games Auto-Scored: 42
```

## Next Steps

1. **Deploy to staging** and test with recent historical data
2. **Set up cron jobs** using recommended schedules
3. **Monitor logs** for auto-scoring activity
4. **Backfill production** with historical data once verified
5. **Add alerting** for auto-scoring failures (optional)

## Rollback Plan

If issues arise:

1. **Revert ingestion job:**
   ```bash
   git checkout HEAD~1 apps/api/src/jobs/ingest-natstat.ts
   ```

2. **Use manual scoring:**
   ```bash
   pnpm --filter @pulse/api score-games
   ```

3. **Re-score specific games:**
   ```bash
   curl -X POST http://localhost:4000/api/admin/games/{gameId}/score \
     -H "Authorization: Bearer $ADMIN_API_KEY"
   ```

## Success Criteria

✅ **All checks passed:**
- [x] TypeScript compilation successful
- [x] All tests pass
- [x] Auto-scoring triggers during ingestion
- [x] Points awarded correctly based on formulas
- [x] User streaks update properly
- [x] Games marked as scored to prevent duplicates
- [x] Errors logged but don't fail ingestion
- [x] Historical CLI works for backfilling
- [x] Documentation complete

---

**Implementation Date:** 2024-01-15
**Status:** ✅ Complete and Ready for Production
