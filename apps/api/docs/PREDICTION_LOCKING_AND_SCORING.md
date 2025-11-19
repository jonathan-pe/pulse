# Prediction Locking and Scoring Flow

## Overview

This document describes the end-to-end flow for locking predictions and scoring games in Pulse. The system is designed to work with periodic ingestion jobs (every 10-15 minutes) without requiring webhooks or high-frequency polling.

## The Problem We Solved

Initially, predictions were never being locked when games started, which meant:
1. The scoring job couldn't score any predictions (it requires `lockedAt != null`)
2. Users weren't receiving points for correct predictions
3. Historical games with results couldn't be retroactively scored

## The Solution

We implemented a two-layer locking mechanism:

### 1. Ingestion-Time Locking (Primary)
When the NatStat ingestion job runs, it now:
- Checks the status of each game
- If `status != 'scheduled'` (meaning the game has started or finished), it automatically locks all unlocked predictions for that game
- This works for both:
  - **Newly started games**: Games transitioning from 'scheduled' to any other status
  - **Already started games**: Games that were already in progress (retroactive locking)

### 2. Scoring-Time Locking (Safety Net)
When the scoring job runs, it also:
- Locks any remaining unlocked predictions before attempting to score them
- This handles edge cases where predictions might have been missed by the ingestion job

## End-to-End Flow

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Ingestion Job (runs every 10-15 minutes)           │
└─────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────────────────────────┐
        │ Fetch game data from NatStat          │
        │ - Game status (scheduled/in-play/final)│
        │ - Current scores (if available)        │
        │ - Latest odds                          │
        └───────────────────────────────────────┘
                            ↓
        ┌───────────────────────────────────────┐
        │ Update game data in database          │
        │ - Update status                        │
        │ - Update scores                        │
        │ - Upsert odds                          │
        └───────────────────────────────────────┘
                            ↓
        ┌───────────────────────────────────────┐
        │ Check: Has game started?               │
        │ (status != 'scheduled')                │
        └───────────────────────────────────────┘
                            ↓
                          YES
                            ↓
        ┌───────────────────────────────────────┐
        │ Lock all unlocked predictions          │
        │ SET lockedAt = NOW()                   │
        │ WHERE gameId = X AND lockedAt IS NULL │
        └───────────────────────────────────────┘
                            ↓
        ┌───────────────────────────────────────┐
        │ Check: Does game have final result?   │
        │ (has scores + status contains 'final')│
        └───────────────────────────────────────┘
                            ↓
                          YES
                            ↓
        ┌───────────────────────────────────────┐
        │ Auto-score the game immediately        │
        │ (calls scoreCompletedGame)             │
        └───────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Scoring (automatic or manual via score-games CLI)  │
└─────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────────────────────────┐
        │ Find games ready to score              │
        │ - Has result (scores exist)            │
        │ - Status contains 'final' (case-insensitive) │
        │ - Not yet scored (scoredAt IS NULL)   │
        └───────────────────────────────────────┘
                            ↓
        ┌───────────────────────────────────────┐
        │ For each game:                         │
        │ 1. Lock any unlocked predictions       │
        │ 2. Fetch all locked, unprocessed preds│
        │ 3. For each prediction:                │
        │    - Determine if correct              │
        │    - Calculate points                  │
        │    - Award points to user              │
        │    - Update user streak                │
        │ 4. Mark game as scored                 │
        └───────────────────────────────────────┘
```

## Key Implementation Details

### Ingestion Job (`ingest-natstat.ts`)

```typescript
// Lock predictions for any game that has started
const currentStatus = ev.status ?? game.status
const gameHasStarted = currentStatus.toLowerCase() !== 'scheduled'

if (gameHasStarted) {
  const lockResult = await prisma.prediction.updateMany({
    where: {
      gameId: game.id,
      lockedAt: null,
    },
    data: {
      lockedAt: new Date(),
    },
  })
  
  if (lockResult.count > 0) {
    logger.info('Locked predictions for started game', {
      gameId: game.id,
      count: lockResult.count,
      status: currentStatus,
    })
  }
}
```

### Scoring Service (`score-game.service.ts`)

```typescript
async scoreCompletedGame(gameId: string): Promise<GameScoringResult> {
  // ... validation ...
  
  // Lock any unlocked predictions (safety net)
  const lockResult = await prisma.prediction.updateMany({
    where: {
      gameId,
      lockedAt: null,
    },
    data: {
      lockedAt: new Date(),
    },
  })
  
  // Fetch locked predictions and score them
  const predictions = await prisma.prediction.findMany({
    where: {
      gameId,
      lockedAt: { not: null },
      processedAt: null,
    },
    // ...
  })
  
  // Score each prediction...
}
```

### Finding Games to Score

```typescript
async findGamesReadyToScore(): Promise<string[]> {
  const games = await prisma.game.findMany({
    where: {
      result: {
        scoredAt: null,
      },
      OR: [
        { status: { contains: 'final', mode: 'insensitive' } },
        { status: { contains: 'Final' } },
      ],
    },
    select: { id: true },
  })
  
  return games.map((g) => g.id)
}
```

## Testing

### Verified End-to-End Test Results

**Test Setup:**
- Game: Phoenix Suns @ Portland Trail Blazers
- Result: 110-127 (Portland wins)
- Predictions: 2
  1. SPREAD home (Phoenix -4.5)
  2. MONEYLINE away (Portland)

**Test Execution:**

1. **Reset State:**
   - Unlocked predictions
   - Reset user points and streak
   - Cleared game scoredAt

2. **Run Ingestion:**
   ```bash
   pnpm ingest 2025-11-19 NBA
   ```
   **Result:** ✅ Predictions locked automatically
   
3. **Auto-Scoring During Ingestion:**
   **Result:** ✅ Game auto-scored, points awarded immediately

**Final State:**
- ✅ Both predictions locked
- ✅ Both predictions processed
- ✅ SPREAD prediction: Incorrect (no points)
- ✅ MONEYLINE prediction: Correct (25 points awarded)
- ✅ User total points: 36 (from multiple games)
- ✅ User streak: 1

## Usage

### Running Ingestion (Cron Job)

```bash
# Ingest today's games
pnpm ingest NBA

# Ingest specific date
pnpm ingest 2025-11-18 NBA

# Ingest date range
pnpm ingest "2025-11-18,2025-11-20" NBA
```

### Running Scoring (Manual or Cron)

```bash
# Score all completed games
pnpm score-games
```

### Recommended Cron Schedule

```cron
# Ingestion: Every 10-15 minutes during game hours
*/10 8-23 * * * cd /app && pnpm ingest NBA
*/10 8-23 * * * cd /app && pnpm ingest NFL
*/10 8-23 * * * cd /app && pnpm ingest NHL
*/10 8-23 * * * cd /app && pnpm ingest MLB

# Scoring: Every 30 minutes (or can rely on auto-scoring during ingestion)
*/30 * * * * cd /app && pnpm score-games
```

## Monitoring

Key metrics to monitor:

1. **Unlocked predictions on started games**: Should be 0
2. **Games with results but not scored**: Should be minimal
3. **Point ledger entries**: Should increase after each scoring run
4. **Prediction lock rate**: Should correlate with game status changes

Query to check for issues:

```typescript
// Unlocked predictions on started games
const unlocked = await prisma.prediction.count({
  where: {
    lockedAt: null,
    game: {
      status: { not: 'scheduled' }
    }
  }
})

// Games with results but not scored
const unscored = await prisma.game.count({
  where: {
    result: {
      scoredAt: null
    },
    status: { contains: 'final', mode: 'insensitive' }
  }
})
```

## Benefits of This Approach

1. **No Webhooks Required**: Works with periodic polling (10-15 minutes)
2. **Retroactive Support**: Can lock and score historical games
3. **Fault Tolerant**: Two-layer locking ensures no predictions are missed
4. **Auto-Scoring**: Games are scored immediately when results are detected
5. **Idempotent**: Running jobs multiple times is safe
6. **Rate Limit Friendly**: Respects NatStat API rate limits
