# Spec: Pulse personal-first scoring and community reframe

## Problem

Pulse currently mixes **competitive mechanics** (bonus-tier multipliers, daily volume diminishing returns, “leaderboard” framing with trophies and rank-change) into a product goal that should feel **casual and personal**. Users who predict often should not earn fewer points per correct pick than users who predict less, and the UI should not prime **climbing ranks** as the main success story.

**Why now:** The app has negligible live usage, so we can **reset data** and simplify scoring and schema without migrating historical ledgers.

## Goal

**Scoring awards and deducts points using odds and outcome only** (no bonus tier, no daily volume penalties in the math). The **primary** experience emphasizes **personal stats and history**; the **global list of other users** is framed as **informational community context**, not a competition ladder. **No social features** ship in this release—only principles for future work.

## Non-Goals

- Building **social** features (follows, feeds, groups, reactions, DMs, friend comparisons).
- **Gambling-adjacent** prizes, wagers, or real-money mechanics.
- **Point inflation** (login bonuses, streak multipliers on points) unless explicitly specified later.
- **Migrating or preserving** pre-refactor `PointsLedger` rows or dual-rule accounting—**full DB reset** is acceptable.
- **Marketing site** (`apps/marketing`) full rewrite—SHOULD align key headlines if they contradict the new positioning (see Tasks).
- Changing the **core probability formulas** for correct/incorrect picks (base points and loss scaling) unless a separate spec says otherwise—this spec removes **multipliers and volume caps** applied on top of those formulas.

## Current State

### Relevant files


| Area              | Path                                                                                                                                                                                                                                                                                                                                                                                                                                    | Role                                                                                                                 |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Schema            | [apps/api/prisma/schema/prediction.prisma](../../apps/api/prisma/schema/prediction.prisma)                                                                                                                                                                                                                                                                                                                                              | `Prediction.bonusTier`                                                                                               |
| Schema            | [apps/api/prisma/schema/user.prisma](../../apps/api/prisma/schema/user.prisma)                                                                                                                                                                                                                                                                                                                                                          | `User.currentStreak`, `longestStreak`; [PointsLedger](../../apps/api/prisma/schema/user.prisma)                      |
| Predictions       | [apps/api/src/services/predictions.service.ts](../../apps/api/src/services/predictions.service.ts)                                                                                                                                                                                                                                                                                                                                      | Sets `bonusTier`, daily limits, error messages                                                                       |
| Scoring           | [apps/api/src/services/points.service.ts](../../apps/api/src/services/points.service.ts)                                                                                                                                                                                                                                                                                                                                                | `calculatePoints` (tier × diminishing returns on wins), `updateUserStreak` (bonus-tier-only), `getUserStats` / stats |
| Scoring           | [apps/api/src/services/score-game.service.ts](../../apps/api/src/services/score-game.service.ts)                                                                                                                                                                                                                                                                                                                                        | Calls points + streak + achievements                                                                                 |
| Shared math       | [packages/shared/src/points.ts](../../packages/shared/src/points.ts)                                                                                                                                                                                                                                                                                                                                                                    | `applyTierMultiplier`, `applyDiminishingReturns`, `calculatePointsForOutcome`, etc.                                  |
| Constants         | [packages/shared/src/constants.ts](../../packages/shared/src/constants.ts)                                                                                                                                                                                                                                                                                                                                                              | `DEFAULT_DAILY_TOTAL_LIMIT`, `DEFAULT_LOSS_MULTIPLIER`, `DAILY_RESET_HOUR_UTC`, streak highlight threshold           |
| API               | [apps/api/src/routers/points.ts](../../apps/api/src/routers/points.ts)                                                                                                                                                                                                                                                                                                                                                                  | `GET /leaderboard`, stats endpoints                                                                                  |
| Types             | [packages/types/src/index.ts](../../packages/types/src/index.ts)                                                                                                                                                                                                                                                                                                                                                                        | `UserStats` (no `bonusTierUsed`); `leaderboardRank` optional                                                         |
| Web API types     | [apps/web/src/types/api.ts](../../apps/web/src/types/api.ts)                                                                                                                                                                                                                                                                                                                                                                            | May mirror stats types                                                                                               |
| Hooks             | [apps/web/src/hooks/usePoints.ts](../../apps/web/src/hooks/usePoints.ts)                                                                                                                                                                                                                                                                                                                                                                | Leaderboard + stats consumers                                                                                        |
| Dashboard         | [apps/web/src/routes/_authenticated/dashboard.tsx](../../apps/web/src/routes/_authenticated/dashboard.tsx)                                                                                                                                                                                                                                                                                                                              | Bonus picks card                                                                                                     |
| Leaderboard route | [apps/web/src/routes/_authenticated/leaderboard.tsx](../../apps/web/src/routes/_authenticated/leaderboard.tsx)                                                                                                                                                                                                                                                                                                                          | Page title, subtitle                                                                                                 |
| Table             | [apps/web/src/components/leaderboard/LeaderboardTable.tsx](../../apps/web/src/components/leaderboard/LeaderboardTable.tsx)                                                                                                                                                                                                                                                                                                              | Trophies, rank, rank change                                                                                          |
| Nav               | [apps/web/src/components/layout/AppSidebar.tsx](../../apps/web/src/components/layout/AppSidebar.tsx), [NavBar.tsx](../../apps/web/src/components/layout/NavBar.tsx)                                                                                                                                                                                                                                                                     | "Leaderboard" label                                                                                                  |
| Bet slip          | [apps/web/src/components/cart/BetSlipSidebar.tsx](../../apps/web/src/components/cart/BetSlipSidebar.tsx)                                                                                                                                                                                                                                                                                                                                | Bonus tier + diminishing returns UI                                                                                  |
| Predictions UI    | [apps/web/src/components/predictions/PredictionsSummaryHeader.tsx](../../apps/web/src/components/predictions/PredictionsSummaryHeader.tsx), [RecentPredictions.tsx](../../apps/web/src/components/dashboard/RecentPredictions.tsx), [PredictionItem.tsx](../../apps/web/src/components/predictions/PredictionItem.tsx)                                                                                                                  | Bonus badges / copy                                                                                                  |
| Achievements      | [apps/api/src/services/achievements.service.ts](../../apps/api/src/services/achievements.service.ts)                                                                                                                                                                                                                                                                                                                                    | May reference streaks / meta                                                                                         |
| CLI               | [apps/api/src/cli/simulate-ev.ts](../../apps/api/src/cli/simulate-ev.ts)                                                                                                                                                                                                                                                                                                                                                                | EV sim with soft/hard caps                                                                                           |
| Docs              | [.github/instructions/overview.instructions.md](../../.github/instructions/overview.instructions.md)                                                                                                                                                                                                                                                                                                                                    | Describes old tier/diminishing rules (numbers may drift vs constants)                                                |
| Tests             | [apps/api/src/services/**tests**/points.service.test.ts](../../apps/api/src/services/__tests__/points.service.test.ts), [packages/shared/src/**tests**/points.test.ts](../../packages/shared/src/__tests__/points.test.ts), [usePoints.test.tsx](../../apps/web/src/hooks/__tests__/usePoints.test.tsx), [points.test.ts](../../apps/api/src/routers/__tests__/points.test.ts), component tests under `leaderboard/` and `predictions/` | Expected behaviors                                                                                                   |


### Data flow (today)

1. User creates prediction → `predictions.service` sets `bonusTier` from daily order → stored on `Prediction`.
2. Game completes → `score-game.service` scores each prediction → `points.service.calculatePoints` applies **1.5× if bonusTier** and **diminishing returns** from **daily prediction order** for **wins**; losses use odds-only formula.
3. Streak updates **only** when `bonusTier` prediction is scored (`updateUserStreak`).
4. Stats API exposes `bonusTierUsed`, `leaderboardRank`, etc. Web shows bonus remaining and leaderboard trophies.

### Consumers / blast radius

Anything importing `bonusTier`, `bonusTierUsed`, `applyDiminishingReturns`, `applyTierMultiplier`, or leaderboard copy in the table above; marketing sections listing competitive framing; generated route tree after renames.

### Existing patterns

- Probability math lives in `packages/shared` and is imported by API.
- Prisma migrations under `apps/api/prisma`.
- REST routers in `apps/api/src/routers/*.ts`.

### Edge cases discovered

- **Daily limit error strings** in `predictions.service.ts` reference **100** in some messages while `DEFAULT_DAILY_TOTAL_LIMIT` is **40**—must be aligned.
- **Streak** is achievement-facing; changing streak rules affects achievement unlock expectations—acceptable with reset.

### Risks / gotchas

- Dropping `bonusTier` requires migration + codegen; all reads/writes must be removed first or in same deploy with reset.
- Renaming routes (`/leaderboard` → `/community`) requires TanStack Router file move + `routeTree.gen` regen—verify build.

## Requirements

### Scoring and data

- **MUST:** For each scored prediction, points for **correct** picks equal **odds-based win formula** only (same as current `calculateBasePoints` / unified outcome pipeline), with **no** `bonusTier` multiplier and **no** `applyDiminishingReturns` (or any volume-based reduction) on wins.
- **MUST:** For **incorrect** picks, points remain **odds-based loss formula** only (no change to the existing “no diminishing returns on losses” behavior unless a bug is found).
- **MUST:** Remove `bonusTier` from the Prisma `Prediction` model and from all application code paths after DB reset.
- **MUST:** `UserStats` (and any duplicate web types) **MUST NOT** expose `bonusTierUsed`.
- **MUST:** Align daily prediction **limit enforcement** and **user-visible error messages** with the configured constant (single source of truth).

### Streaks (decision locked for implementability)

- **MUST:** `updateUserStreak` advances/resets streak based on **every** scored prediction (not only former bonus-tier rows). Streaks remain **cosmetic** for achievements; they **MUST NOT** change point totals.

### Community / UI (informational, not aspirational)

- **MUST:** Primary nav label for the global list **MUST NOT** be the word **“Leaderboard”**; use **“Community”** (or equivalent agreed in implementation—default to **Community**).
- **MUST:** Page title and subtitle **MUST NOT** use “Leaders” / “stack up” / competitive framing; use neutral copy (e.g. how others are doing lately).
- **MUST:** Remove **trophy** icons and **rank-change** indicators from the default community table UI (plain rank number or omitted rank is acceptable—see SHOULD).
- **MUST:** Dashboard **MUST NOT** show “bonus picks remaining” or explain diminishing returns as part of scoring.
- **SHOULD:** Remove or soften prominent **#1–#3** visual treatment; if rank is shown, present as a **column**, not a podium hero.
- **SHOULD:** Keep **numeric rank** in API responses for sorting if needed; UI reframing satisfies the product goal without requiring an API rename in v1.

### Scope boundaries

- **MUST NOT:** Add new social features, pool leaderboards, or friend-vs-friend comparisons in this change set.
- **SHOULD:** Document future social **principles** in [.github/TECHNICAL_CONTEXT.md](../../.github/TECHNICAL_CONTEXT.md) (principles only, not commitments).

### Documentation

- **MUST:** Update [.github/instructions/overview.instructions.md](../../.github/instructions/overview.instructions.md) so scoring description matches code and **one** set of numeric constants.

## Acceptance Criteria

- Given a user makes **N** correct predictions in one day (N above old soft cap), when games are scored, then **each** correct pick receives **full** odds-based points (no zeroing from volume).
- Given any correct prediction after this refactor, when points are computed, then **no** multiplier is applied based on “first picks of day” or `bonusTier`.
- Given the Prisma schema after migration, when introspected, then `Prediction` has **no** `bonusTier` column.
- Given the dashboard loads, when viewed, then there is **no** UI showing bonus-tier picks remaining or diminishing-returns explainer tied to points.
- Given the community page loads, when viewed, then the nav label is **not** “Leaderboard” and the page does **not** show trophy icons or rank-change arrows as in the pre-refactor `LeaderboardTable`.
- Given a user’s prediction is scored, when streak is updated, then streak changes apply regardless of former bonus-tier rules (verify with unit test).
- Given API stats for a user, when fetched, then the payload does **not** include `bonusTierUsed`.
- Given daily prediction limit is exceeded, when the user submits another pick, then the error message matches the actual configured limit (same number as enforcement).

## Edge Cases


| Scenario                                      | Expected behavior                                                                                                                       |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| User replaces/changes a pick on the same game | Still no bonus-tier scoring; follow existing contradiction/replace rules (only update tests if behavior tied to `bonusTier`).           |
| Incorrect prediction                          | Negative points from odds formula only; unchanged from current loss path except removal of any stray meta assumptions.                  |
| Empty leaderboard period                      | Same as today: show empty state, no errors.                                                                                             |
| `leaderboardRank` in stats                    | Field may remain `null` or be removed—if removed, update all consumers; if kept, document that it is optional context, not primary CTA. |
| Achievements depending on streak              | After reset, streaks restart; acceptable. Re-verify achievement conditions still make sense with “any prediction” streak updates.       |
| Marketing site copy                           | Out of scope for MUST; if it promises bonus tiers, file a SHOULD follow-up or adjust in same PR if trivial.                             |


## Constraints

- **Stack:** Existing monorepo—TypeScript, Prisma, TanStack Router, shared package for math.
- **Simplicity:** Prefer deleting code paths (`bonusTier`, diminishing returns helpers) over feature flags.
- **Forbidden:** New abstractions (“strategy registry”) unless required by testability.
- **Data:** DB reset allowed—no dual-write or ledger migration.
- **Scope:** Touch only files required for scoring, stats, schema, community UI, tests, and listed docs; marketing optional unless explicitly pulled into a task.

## API Contract

### Existing endpoints (behavioral contract after change)

`**GET /api/points/leaderboard`** (path MAY stay for compatibility)

- **Query:** `period` ∈ `daily` | `weekly` | `alltime`, `limit` (optional, default 50).
- **Response:** Array of entries with at least `userId`, `points`, display fields; `rank` may remain for ordering. **MUST NOT** require clients to show trophies (UI change).
- **Errors:** Unchanged HTTP error shape.

**User stats endpoint** (exact path as implemented in [points.ts](../../apps/api/src/routers/points.ts))

- Response **MUST NOT** include `bonusTierUsed`.

*Concrete JSON shapes should match updated `packages/types` after implementation.*

## Future social product (architecture only)

Not implemented in this spec. When building social later: avoid default **zero-sum** surfaces (“you lost to X”); prefer **user-scoped** stats and **opt-in** comparisons; see plan discussion in repo history. Do **not** add schema for follows/pools in this refactor unless a task explicitly requires it (it does not).

## Tasks

Atomic implementation order; each task should be committable. Tests are **part of** the task that changes behavior.

1. **Shared math cleanup**
  - Remove or stop exporting `applyTierMultiplier` / `applyDiminishingReturns` from the scoring path; keep pure odds helpers.  
  - Files: [packages/shared/src/points.ts](../../packages/shared/src/points.ts), [packages/shared/src/**tests**/points.test.ts](../../packages/shared/src/__tests__/points.test.ts)  
  - Done: Shared tests pass; no production caller applies diminishing returns to wins.
2. **API scoring and streak**
  - Update [points.service.ts](../../apps/api/src/services/points.service.ts): `calculatePoints` without tier/diminishing; `updateUserStreak` without bonus-tier gate.  
  - Update [predictions.service.ts](../../apps/api/src/services/predictions.service.ts): stop writing `bonusTier`; fix daily limit messages.  
  - Update [score-game.service.ts](../../apps/api/src/services/score-game.service.ts) if meta/ledger still references `bonusTier`.  
  - Files: above + [points.service.test.ts](../../apps/api/src/services/__tests__/points.service.test.ts)  
  - Done: Service tests reflect odds-only wins and streak on any prediction.
3. **Prisma migration**
  - Drop `bonusTier` from `Prediction`; run generate.  
  - Files: [apps/api/prisma/schema/prediction.prisma](../../apps/api/prisma/schema/prediction.prisma), new migration under `apps/api/prisma/migrations/`  
  - Done: `prisma migrate` applies on empty DB after reset.
4. **Stats API and types**
  - Remove `bonusTierUsed` from [packages/types/src/index.ts](../../packages/types/src/index.ts) and API handlers [points.ts](../../apps/api/src/routers/points.ts); sync [apps/web/src/types/api.ts](../../apps/web/src/types/api.ts) if needed.  
  - Done: Typecheck passes; `points` router tests updated.
5. **Web UI: dashboard + predictions + bet slip**
  - Remove bonus-tier badges and copy from [dashboard.tsx](../../apps/web/src/routes/_authenticated/dashboard.tsx), [BetSlipSidebar.tsx](../../apps/web/src/components/cart/BetSlipSidebar.tsx), [PredictionsSummaryHeader.tsx](../../apps/web/src/components/predictions/PredictionsSummaryHeader.tsx), [RecentPredictions.tsx](../../apps/web/src/components/dashboard/RecentPredictions.tsx), [PredictionItem.tsx](../../apps/web/src/components/predictions/PredictionItem.tsx).  
  - Done: No “bonus picks remaining” or diminishing returns messaging.
6. **Web UI: community (ex-leaderboard)**
  - Rename route/file if desired (`leaderboard.tsx` → `community.tsx`) **or** keep URL and change strings only; update [AppSidebar.tsx](../../apps/web/src/components/layout/AppSidebar.tsx), [NavBar.tsx](../../apps/web/src/components/layout/NavBar.tsx), [leaderboard.tsx](../../apps/web/src/routes/_authenticated/leaderboard.tsx), [LeaderboardTable.tsx](../../apps/web/src/components/leaderboard/LeaderboardTable.tsx).  
  - Done: Acceptance criteria for copy and trophies satisfied; `routeTree.gen.ts` updated by build.
7. **Hooks and tests**
  - [usePoints.ts](../../apps/web/src/hooks/usePoints.ts), [usePoints.test.tsx](../../apps/web/src/hooks/__tests__/usePoints.test.tsx), [LeaderboardTable.test.tsx](../../apps/web/src/components/leaderboard/__tests__/LeaderboardTable.test.tsx), prediction component tests.  
  - Done: Web test suite passes for touched packages.
8. **CLI and misc**
  - Update [simulate-ev.ts](../../apps/api/src/cli/simulate-ev.ts) to remove obsolete cap assumptions or document new model.  
  - Done: CLI runs without referencing removed functions incorrectly.
9. **Documentation**
  - [overview.instructions.md](../../.github/instructions/overview.instructions.md); optional [.github/TECHNICAL_CONTEXT.md](../../.github/TECHNICAL_CONTEXT.md) note on future social principles.  
  - Done: Docs match implementation.
10. **Marketing (SHOULD)**
  - Scan [apps/marketing](../../apps/marketing) for “bonus”, “leader”, competitive claims; align or ticket.  
    - Done: No contradictory MUST statements in primary hero/FAQ **or** explicit follow-up issue linked in spec commit message.

---

## Review checklist (from writing-specs)


| Dimension          | Status                                                               |
| ------------------ | -------------------------------------------------------------------- |
| Problem clarity    | Yes—competitive mechanics vs personal journey                        |
| Testable criteria  | Yes—checkboxes and table                                             |
| Scope boundaries   | Non-goals + future social excluded                                   |
| Observable done    | Dashboard + community + scoring behavior                             |
| No spurious impl   | Requirements are behavioral; Prisma/TanStack named only where stable |
| Terminology        | Community vs Leaderboard consistent                                  |
| Codebase alignment | Files from repo search                                               |
