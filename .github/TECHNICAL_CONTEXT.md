# Pulse - Technical Context & Implementation History

> **Purpose**: This document provides essential technical context for AI assistants and developers. It captures key implementation decisions, architectural patterns, and gotchas that inform future development decisions.
>
> **Note**: For user-facing documentation, see the [Notion Documentation Hub](https://www.notion.so/2b1b971a5f65815ca215db86a24c75e2).
>
> **⚠️ IMPORTANT**: This document must be kept up-to-date as the codebase evolves. When making architectural changes, adding features, or discovering gotchas, update this document accordingly.

---

## Documentation Maintenance Guidelines

### When to Update This Document

**Always update when**:
- Making architectural decisions (API design, data modeling, integration patterns)
- Discovering non-obvious behavior or gotchas
- Changing existing patterns (e.g., scoring logic, normalization rules)
- Adding new integrations or data sources
- Modifying critical algorithms (point calculation, spread normalization)
- Encountering and solving complex bugs

**What to update**:
- Add new sections for new features/patterns
- Update existing sections when behavior changes
- Add to "Known Issues & Gotchas" when discovering edge cases
- Update "Common Debugging Scenarios" with solutions found
- Keep "Future Architectural Considerations" current with decisions made

### When to Update Notion Documentation

**User-facing changes**:
- New API endpoints or endpoint changes → Update "API Endpoints" page
- New CLI commands or changed usage → Update "CLI Commands" page
- Setup/installation changes → Update "Getting Started" or "Database Setup"
- New cron jobs or schedule changes → Update "CRON Schedule" page
- New features shipping → Update "Feature Roadmap" (move from planned to implemented)

**How to update Notion**: Use the Notion MCP tools to update existing pages or create new ones under the Documentation Hub.

---

## Architecture Overview

### Tech Stack
- **Backend**: Express (Node.js) + TypeScript + Prisma ORM + PostgreSQL
- **Frontend**: Vite + React + TanStack Router + TanStack Query
- **Auth**: Clerk
- **Data Sources**: NatStat API (odds/scores), ESPN API (team metadata)

### Migration History
- **tRPC → Express REST**: Migrated from tRPC to standard REST API for simpler stack and better HTTP client compatibility
  - All `/api/*` endpoints now use Express routers
  - Zod validation still used at route level
  - Standard HTTP status codes (400/401/404/500)
  - Authentication via Clerk `getAuth(req)` middleware

---

## Point Spread Convention ⚠️

**CRITICAL**: All point spreads are stored **relative to the home team**.

### Storage Rule
- **Negative spread** (`-7.5`) = Home team is **favored** (gives points)
- **Positive spread** (`+3.5`) = Home team is **underdog** (receives points)

### Implementation Details
- NatStat provides `spread.favourite` team ID to indicate which team is favored
- We map team IDs to team codes using `NatStatTeam` lookup table
- `adjustSpreadSigns()` in `normalize.ts` ensures home-relative storage:
  ```typescript
  if (favouriteCode === homeCode) {
    spread = -Math.abs(spread)  // Home favored: negative
  } else {
    spread = Math.abs(spread)   // Away favored: positive (home gets points)
  }
  ```
- **Why**: Consistency across all markets, simplifies prediction evaluation logic

### Scoring Logic
When evaluating spread predictions:
- Home pick: `homeScore + spread > awayScore` (negative spread means home needs to win by more)
- Away pick: `awayScore > homeScore + spread` (positive spread means home can lose by less)

---

## Auto-Scoring System

### Implementation Pattern
Auto-scoring is **embedded in the ingestion job**, not a separate process.

```typescript
// In ingest-natstat.ts
if (gameHasResult && !result.scoredAt) {
  try {
    await scoreGameService.scoreCompletedGame(gameId)
    // Awards points, updates streaks, marks game as scored
  } catch (error) {
    logger.error('Auto-scoring failed', error)
    // Ingestion continues - scoring errors don't break ingestion
  }
}
```

### Key Principles
1. **Idempotent**: Safe to run multiple times (checks `scoredAt` timestamp)
2. **Error Isolated**: Scoring failures don't break ingestion
3. **Automatic**: No manual intervention needed for 95%+ of games
4. **Fallback Available**: Admin endpoints + CLI for edge cases

### Prediction Locking
Predictions are locked at two points:
1. **During ingestion**: When game status changes from 'scheduled' to any other status
2. **During scoring**: Safety net to catch any unlocked predictions

---

## NatStat Integration

### Unified Endpoint
We use `/forecasts` endpoint (not separate moneyline/spread/total endpoints).

**Benefits**:
- Single API call per league/date (was 3 calls)
- All markets guaranteed from same snapshot
- Includes game status, scores, venue, ELO ratings
- Automatic score ingestion for completed games

### League Code Mapping
| Standard | NatStat | Sport |
|----------|---------|-------|
| NFL | pfb | Pro Football |
| NBA | nba | Basketball |
| MLB | mlb | Baseball |
| NHL | nhl | Hockey |

### Response Structure
```json
{
  "forecasts": [
    {
      "home": "Team Name",
      "home-code": "ABC",
      "visitor": "Team Name",
      "visitor-code": "XYZ",
      "forecast": {
        "moneyline": { "home": -150, "visitor": 130 },
        "spread": { "spread": "-3.5" },
        "overunder": { "overunder": "45.5" },
        "simulation": {
          "prediction-favourite-code": "ABC"  // Used for spread sign adjustment
        }
      },
      "score": {
        "home-score": "24",
        "visitor-score": "17"
      }
    }
  ]
}
```

---

## Team Data Management

### NatStatTeam Table
Caches team data to avoid repeated API lookups.

**Purpose**:
1. Map NatStat team IDs to team codes (for spread normalization)
2. Store ESPN logo URLs for UI display
3. Track active/inactive teams per league

**Sync Schedule**: Yearly, one month before season start
- NFL: Aug 1
- NBA/NHL: Sep 1
- MLB: Mar 1

### ESPN Integration
- **Public API**: No auth required
- **Logo Types**: `badgeUrl` (primary), `logoUrl` (alternate/dark)
- **Endpoints**: `https://site.api.espn.com/apis/site/v2/sports/{sport}/{league}/teams`
- **Matching**: By abbreviation (primary), falls back to fuzzy name matching

---

## Point Scoring Algorithm

### Base Points (All Tiers)
```typescript
impliedProbability = odds < 0 
  ? Math.abs(odds) / (Math.abs(odds) + 100) * 100
  : 100 / (odds + 100) * 100

basePoints = 10 * (100 / impliedProbability)
```

**Examples**:
- `-500` (83% favorite): 12 points
- `-110` (52% favorite): 19 points  
- `+150` (40% underdog): 25 points
- `+700` (12.5% longshot): 80 points

### Streak Bonuses (Bonus Tier Only)
- 2-win: +10 points
- 3-win: +25 points
- 4-win: +50 points
- 5+ win: +100 points (capped)

### Tier System
1. **Bonus Tier**: First 5 predictions daily (by `createdAt` timestamp)
   - Base points + streak bonuses
   - Tier status locked at creation (replacements inherit tier)
2. **Baseline Tier**: Unlimited predictions
   - Base points only
   - No streak bonuses
3. **Diminishing Returns**:
   - Predictions 1-30: 100% points
   - Predictions 31-75: 50% points
   - Predictions 76+: 0 points

### Expected Value Fairness
System is mathematically balanced so all strategies have equal EV (~10 points):
- Heavy favorite (-300): 0.75 × 13.3 = 10.0 EV
- Pick'em (+100): 0.50 × 20.0 = 10.0 EV
- Longshot (+700): 0.125 × 80.0 = 10.0 EV

---

## Database Patterns

### Idempotency via Composite Keys
```prisma
// Games: Upserted by external ID or deterministic hash
@@unique([externalId])

// Odds: Upserted by (gameId, book, market)
@@unique([gameId, book, market])

// Scoring: Guarded by scoredAt timestamp
Result {
  scoredAt DateTime?  // null = not scored, non-null = already scored
}

// Points: Guarded by processedAt timestamp
Prediction {
  processedAt DateTime?  // null = not processed, non-null = already processed
}
```

### Team Identity
- **Primary Key**: NatStat team ID (e.g., "2022531")
- **Unique Constraint**: `(league, code)` for lookups
- **Code Examples**: "JAX" (NFL), "LAL" (NBA), "BOS" (MLB)

---

## Known Issues & Gotchas

### 1. Push Handling (Not Yet Implemented)
- Currently, pushes (tie on spread/total) count as **incorrect**
- **TODO**: Should return `null` for `isCorrect` to preserve streak
- Affects user experience on spread/total predictions

### 2. Odds Capture Requirement
- Predictions created before odds capture feature will have `oddsAtPrediction: null`
- These predictions may have scoring issues (used fallback -110 odds)
- **TODO**: Consider stricter validation to require odds at creation time

### 3. Timezone Considerations
- All CRON schedules in Pacific Time (PT)
- PT = UTC-7 (PDT, March-Nov) or UTC-8 (PST, Nov-March)
- Ingestion jobs use 15-minute intervals during active hours
- Team sync uses yearly schedules (one month before season)

### 4. Rate Limiting
- NatStat: 15-minute intervals = ~4 calls/hour per league (within limits)
- ESPN: Public endpoint, no strict limits but use reasonable intervals
- Both use single retry with exponential backoff on 5xx errors
- Both skip retry on 429 (too many requests) to respect limits

---

## CLI Commands Quick Reference

```bash
# Ingestion
pnpm --filter @pulse/api ingest NBA                    # Today
pnpm --filter @pulse/api ingest NBA 2025-11-15         # Specific date
pnpm --filter @pulse/api ingest NBA 2025-11-15,2025-11-22  # Date range
pnpm --filter @pulse/api ingest-historical NBA 7       # Last 7 days

# Team Management
pnpm --filter @pulse/api sync-teams NFL                # Sync NFL teams

# Manual Scoring (Fallback)
pnpm --filter @pulse/api score-games                   # Score all ready games
```

---

## Testing Philosophy

### Service Layer
- Unit tests with mocked Prisma client
- Test business logic independently
- Focus on edge cases (ties, missing odds, etc.)

### Integration Layer
- Test normalization functions with real-world data shapes
- Verify spread sign adjustment logic
- Test error handling and partial data scenarios

### E2E (Future)
- Playwright tests for critical user flows
- Seed database with known game data
- Verify scoring calculations end-to-end

---

## Future Architectural Considerations

### Webhook vs Polling
Current: **Polling** (15-minute CRON jobs)
- Simpler to implement and maintain
- Sufficient for current scale
- Consider webhooks if NatStat offers them in future

### Caching Strategy
Current: **Database-backed** (NatStatTeam table)
- Simple, persistent, no external dependencies
- Consider Redis if performance becomes issue

### Monitoring
Current: **Structured logging** (Winston)
- Info/warn/error with context
- Ready for integration with Datadog/CloudWatch
- Consider adding OpenTelemetry for distributed tracing

### Multi-Provider Odds
Current: **Single provider** (NatStat)
- Simplifies implementation
- Consider adding FanDuel/DraftKings APIs for:
  - Best line selection
  - Source attribution
  - Redundancy if NatStat is down

---

## Common Debugging Scenarios

### Game Not Scoring
1. Check if result exists: `SELECT * FROM "Result" WHERE "gameId" = ?`
2. Check if already scored: Check `scoredAt` field
3. Check game status: Must contain 'final' (case-insensitive)
4. Manually trigger: `POST /api/admin/games/:id/score`

### Spread Sign Issues
1. Verify `NatStatTeam` data exists for both teams
2. Check `spreadFavouriteId` in raw NatStat response
3. Verify `adjustSpreadSigns()` mapping logic
4. Compare stored spread to team codes

### Predictions Not Locking
1. Check game status in database (should not be 'scheduled')
2. Verify ingestion job is running
3. Check logs for locking SQL updates
4. Manually lock via admin endpoint if needed

### Missing Team Logos
1. Run `sync-teams` for the league
2. Verify ESPN API is accessible
3. Check team code matching logic
4. Fallback: Logos will be null, UI should handle gracefully

---

*Last updated: November 19, 2025*
*For current feature status and roadmap, see Notion Documentation Hub*
