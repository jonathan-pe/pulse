# Spec: Parlays and same-game parlays (Pulse)

## Problem

Users want to combine multiple picks into **parlays** (multi-game) and **same-game parlays (SGPs)** similar to sportsbooks: higher risk/reward than isolated picks, with combined pricing that reflects how legs relate (independence vs correlation).

Pulse today only supports **standalone** predictions per game/type/pick (`Prediction` rows), scored one at a time with odds-only points (`[packages/shared/src/points.ts](../../packages/shared/src/points.ts)`). There is no combined ticket, no cross-leg settlement, and no pricing model for correlated legs in one game.

**Why now:** Parlays are a standard expectation in sports prediction UX; implementing them requires explicit data models, settlement rules, and scoring—otherwise future work will duplicate or conflict with single-pick flows.

## Goal

Users can create **parlay tickets** made of **legs** (each leg is a standard Pulse market: moneyline, spread, or total). **Multi-game parlays** combine legs from **different games**. **Same-game parlays** combine **multiple legs from one game** with **correlation-aware combined pricing** (not naive independent multiplication). When games settle, each parlay resolves to a **single points outcome** per ticket, recorded in the ledger with clear metadata, without double-counting leg points.

## Non-Goals

- Real-money wagering, payouts, stakes, cash-out, or house margin as a business model.
- Player props, alt lines, or markets beyond existing `PredictionType` (`MONEYLINE`, `SPREAD`, `TOTAL`) unless a separate spec extends markets.
- A proprietary quant-trading–grade correlation engine in v1; a **documented, tunable approximation** is acceptable.
- Live/in-play parlay acceptance rules beyond what existing “game not started” validation already implies.
- Social features (sharing slips, leaderboards framed around parlay hit rate) unless explicitly added later.

## Industry reference (how books work today)

This section informs product behavior; Pulse is **points-based**, not cash, but the **structure** mirrors books.

### Traditional (multi-game) parlays

- **All legs must win** for the parlay to win (standard definition).
- **Odds combination:** Books typically convert each leg’s American odds to **decimal**, **multiply** decimals across legs, then convert back to American for display. This assumes **independence** between games (reasonable for different events).
- **Pushes:** For spread/total, a **push** usually **removes** that leg (treated as odds 1.0 / “no bet” on that leg) and **downgrades** the parlay to fewer legs rather than losing the whole ticket.
- **Voids/cancellations:** Missing games are often removed like pushes.

### Same-game parlays (SGPs)

- Legs in **one game** are **not independent**. Naive multiplication **overstates** payouts for combinations that tend to move together (e.g. team wins + game goes over).
- Books price SGPs with **correlation adjustments** (often proprietary): implied joint probability is **higher** than the product of marginal implied probabilities for many popular positively correlated combos—so the **fair price is worse for the bettor** than multiplying single-leg American odds.
- **Eligibility:** Some combinations are **disallowed** or only offered inside an SGP product with a specific price. Classic **same-team moneyline + spread** may be restricted on multi-leg slips; **SGP builders** allow correlated legs with an adjusted price.

**Sources (for internal orientation):** e.g. Wizard of Odds on SGP correlation; industry guides on SGP vs independent multiplication; standard parlay push handling descriptions.

## Current State

### Relevant files


| Area                | Path                                                                                                   | Role                                                                               |
| ------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Schema              | `[apps/api/prisma/schema/prediction.prisma](../../apps/api/prisma/schema/prediction.prisma)`           | `Prediction` model, `PredictionType`, uniqueness on `[userId, gameId, type, pick]` |
| Predictions API     | `[apps/api/src/routers/predictions.ts](../../apps/api/src/routers/predictions.ts)`                     | `POST /`, `POST /batch` (max 20 items), reads for history/pending                  |
| Predictions service | `[apps/api/src/services/predictions.service.ts](../../apps/api/src/services/predictions.service.ts)`   | Validation, odds snapshot, contradicting-pick replacement                          |
| Scoring             | `[apps/api/src/services/score-game.service.ts](../../apps/api/src/services/score-game.service.ts)`     | Scores predictions when a game completes; ledger + streak + achievements           |
| Points              | `[apps/api/src/services/points.service.ts](../../apps/api/src/services/points.service.ts)`             | `isPredictionCorrect`, `calculatePoints`, ledger write                             |
| Shared math         | `[packages/shared/src/points.ts](../../packages/shared/src/points.ts)`                                 | Implied probability, base points, incorrect points                                 |
| Product context     | `[.github/instructions/overview.instructions.md](../../.github/instructions/overview.instructions.md)` | Odds-only scoring, no real money                                                   |


### Data flow (today)

1. User submits pick → `Prediction` row with `oddsAtPrediction` snapshot.
2. Game finishes → `score-game.service` loads predictions for that `gameId`, scores each row independently → one `pointsLedger` entry per prediction.

### Important behavioral gap (being fixed)

`[PointsService.isPredictionCorrect](../../apps/api/src/services/points.service.ts)` currently treats **moneyline ties**, **spread pushes**, and **total pushes** as **incorrect** (`false`). **This spec changes that:** every leg and every standalone pick MUST resolve to **win**, **loss**, or **push** (push = neutral—not a win, not a loss). Schema and scoring must represent push explicitly (e.g. `isCorrect` nullable, a result enum, or separate `outcome` field)—see Requirements.

### Consumers / blast radius

- Any UI that lists predictions per game (`[apps/web](../../apps/web)` prediction components, bet slip patterns).
- Stats, achievements, and **two streak systems** (singles-only vs parlay-leg) plus **largest won parlay** (see Requirements).
- Parlay leg count limit **20**, aligned with batch prediction limit (`max(20)` on `POST /predictions/batch`).

## Requirements

### Product definitions

- **Parlay ticket:** A single user-owned object with **status** (pending → won / lost / pushed / voided as defined below), **type** `MULTI_GAME` or `SAME_GAME`, **frozen leg list** with odds snapshots at creation, and **one** points outcome when settled.
- **Leg:** Same semantic as today’s prediction (game, type, pick) plus **per-leg settlement** (win / loss / push). Parlay legs live on `**ParlayLeg` only** (see “Data model: legs storage” below)—not as duplicate `Prediction` rows unless product later adds an explicit “count as both” mode (out of scope).

### Data model: legs storage (normative recommendation)

**Recommendation: store parlay legs only as `ParlayLeg` rows** (linked to `Parlay`), not as additional `Prediction` rows.


| Approach                                | Pros                                                                                                                                                                                                                                             | Cons                                                                                                                                                                                                                                                                                                         |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **ParlayLeg only**                      | Single scoring path for parlay tickets—**no risk of double ledger entries**; v1 **forbids** the same market on a single and a parlay leg while pending, so no ambiguous double exposure; parlay domain stays explicit in queries and migrations. | Leg validation and odds snapshot logic parallels `PredictionsService`—**share helpers** in code to avoid drift; history views need to **union** singles (`Prediction`) and parlays (`Parlay`) for “everything I picked.”                                                                                     |
| **Also store each leg as `Prediction`** | Reuses one table for “any pick” in simple listings.                                                                                                                                                                                              | Requires `parlayId` + `excludeFromSinglesScoring` (or similar) on every code path that scores predictions; easy to **accidentally score twice**; uniqueness prevents the same market in both single and parlay unless you relax constraints—**product** would have to forbid or allow duplicates explicitly. |


**Conclusion:** Prefer **ParlayLeg-only** for legs; extract **shared validation** (game open, pick format, odds fetch) into a small internal module used by both `PredictionsService` and `ParlaysService`.

### Multi-game parlay

- MUST: Allow **2+ legs** from **distinct** `gameId`s.
- MUST: **Cap** leg count at **20** (same upper bound as `POST /predictions/batch`).
- MUST: **Reject** legs from the same game in a `MULTI_GAME` parlay (force SGP flow instead).
- MUST: Compute a **combined fair probability** using **independence**: multiply decimal implied probabilities (or equivalently multiply decimal odds and convert) from the snapshot at placement—consistent with standard book parlay pricing for cross-game legs.
- MUST: Map that combined probability through the **existing Pulse points framework** (same EV philosophy as single picks: one scalar outcome for the ticket using combined odds—see Constraints).

### Same-game parlay (SGP)

- MUST: Allow **2+ legs** on the **same** `gameId`.
- MUST **not** use naive independence multiplication for the **final** combined price; apply a **correlation adjustment** so SGP tickets are not systematically mispriced vs multi-game parlays.
- MUST: Reject **disallowed** leg combinations (initial rules below) with a clear API error.
- SHOULD: Represent adjustment as **versioned** rules (e.g. `sgpPricingVersion`) stored on the ticket for reproducible scoring.

### Settlement

- MUST: **Singles:** Resolve each `Prediction` to **win**, **loss**, or **push**. Push → **0 points** (no win points, no loss points); **does not** increment or reset `singlesCurrentStreak` / `singlesLongestStreak` (unchanged for that event).
- MUST: **Parlay legs:** Each `ParlayLeg` resolves to **win**, **loss**, or **push** using the same rules as singles for that market type.
- MUST: **Parlay ticket** after all legs are settled:
  - **Remove** any leg that **pushed**; **recompute** the parlay from the remaining legs’ snapshots (combined probability and points as if the ticket had been placed with only those legs). Repeat until no pushes remain or the ticket resolves.
  - **Lost** if **any** remaining leg **lost** (after pushes removed).
  - **Won** if **every** remaining leg **won** and **at least one** leg remains.
  - **Push (whole ticket)** if **no** legs remain after removing pushes (e.g. all legs pushed, or reduced to zero legs)—**0 points**, no parlay win/loss points.
  - **Single leg left** after push removal: settle that ticket as a **one-leg parlay** using the same points machinery as a single pick at that leg’s odds (equivalent EV to placing one straight bet)—must match standalone `Prediction` math for the same snapshot.
- MUST: Award **exactly one** ledger entry (or one net delta) per parlay ticket, with `meta` containing `parlayId`, per-leg outcomes, post-push effective leg list, and combined pricing inputs.
- MUST NOT: Score the same outcome twice: a market may appear as **either** a standalone `Prediction` **or** a `ParlayLeg`, not both—see **Duplicate market (v1)** below.

### Duplicate market (v1 — locked)

- MUST **not** allow the same user to have **both** (a) a standalone `Prediction` and (b) a `ParlayLeg` (including **pending / unsettled** parlays) for the **same** `(gameId, type, pick)` tuple.
- **Example:** A user with a **pending** single on the **moneyline home** for `gameId = G` **cannot** submit a parlay (any parlay) that includes the leg `(gameId: G, type: MONEYLINE, pick: home)` until that conflict no longer applies (e.g. after the single is settled and product rules allow new picks—typically the game is done, so new picks on `G` are moot). They **can** still build a parlay on **other** games or other markets on `G` (e.g. spread) unless blocked by SGP rules.
- MUST reject `POST /api/predictions` and `POST /api/predictions/batch` when that market is already used on an **open** parlay leg; reject `POST /api/parlays` when any leg duplicates an existing **pending** single prediction. Use stable error codes `MARKET_ALREADY_IN_PARLAY` / `MARKET_ALREADY_SINGLE` (or one code with detail)—document in API Contract table.

**Design note (vs real-money sportsbooks):** Many books allow the **same selection** to appear on **multiple tickets** (e.g. a straight bet and a parlay leg) because each ticket has its **own stake** and payout. Pulse awards **points**, not cash, and has no notion of independent stakes per ticket—allowing the same pending outcome on both a single and a parlay would either **double-count** toward points and stats or require complex “which ticket wins the points?” rules. **v1 therefore forbids** overlapping singles and parlay legs on the same `(gameId, type, pick)`; we may relax this later with an explicit scoring policy if product needs book-like flexibility.

### Streaks and “largest parlay” (achievement-oriented)

- MUST: **Rename** legacy `currentStreak` / `longestStreak` on `[User](../../apps/api/prisma/schema/user.prisma)` to `singlesCurrentStreak` and `singlesLongestStreak` (Prisma migration: copy values, drop old columns). These apply **only** to **standalone `Prediction`** scoring. Updates: **increment** on a **win** single; **reset** on a **loss** single; **no change** on a **push**.
- MUST: **Parlay-leg streak:** New fields `parlayLegCurrentStreak` and `parlayLegLongestStreak` on `User`, updated **only** when **parlay legs** are scored (not when standalone singles score). Rules: **increment** by **1** for each **winning** parlay leg when that leg settles; **no change** for a **push** leg; **reset to 0** when a parlay leg **loses**. (Each winning leg is one unit—parallel to **singles** streak counting correct singles.) If product later wants a streak of **tickets won** or **days with a parlay placed**, replace these rules in a follow-up spec.
- MUST: **Largest successful parlay:** Track the user’s **maximum leg count** among **won** parlay tickets (after push removal, using **final** winning leg count), field `largestParlayWinLegCount` on `User` (denormalized); update when a parlay settles **won** if `effectiveLegCount > prior max`.
- SHOULD: Wire achievements to these fields (e.g. milestones for parlay-leg streak and for largest hit parlay)—exact achievement keys in `achievements` work, not in this spec’s scope beyond storing the metrics.

### API / UX (high level)

- MUST: Expose create + read endpoints for parlay tickets (exact paths in API Contract).
- MUST: Return **quoted combined odds / implied probability** at placement time for transparency.
- SHOULD: Surface parlays in history as **first-class** items distinct from one-off predictions.
- MUST: In **parlay mode** and **SGP mode** (when the user is building a multi-leg ticket, not placing singles only), any **market button** that is **disabled** because that `(gameId, type, pick)` is **not selectable**—including **already picked** as a **pending single**, **already added** to the current parlay slip, or otherwise blocked by **Duplicate market (v1)**—MUST show a **tooltip** on hover/focus explaining **why** (short user-facing summary of the **Design note**: Pulse uses points, not separate stakes per ticket, so one active pick per market keeps scoring fair; sportsbooks often allow multiple wagers on the same outcome). Do **not** rely on the prediction slip sidebar for this; place tooltips on the **disabled buttons** themselves (use a `Tooltip` + wrapper `span` if `disabled` blocks pointer events on `Button`).
- SHOULD: **Error toasts** for failed submit (`MARKET_ALREADY_`*, etc.) use the **same** copy theme as the tooltips (shared strings module).

### UI copy (duplicate market — reference)

Suggested one-line tooltip body (tune in implementation): *“You already have this pick as a single. Pulse scores points, not separate bets like a sportsbook—one open pick per market.”* Variants for “already in this parlay” / server-blocked should stay consistent with the Design note above.

## Acceptance criteria

- Given a user builds a **2-leg multi-game** parlay with valid pregame legs, when they submit, then the system stores **one** ticket with **two** legs, each with odds snapshots, and returns a **combined quote** consistent with independence multiplication.
- Given a user builds an **SGP** with allowed legs, when they submit, then the combined quote **differs** from naive independence multiplication by a **documented** correlation adjustment (non-zero effect in test fixtures).
- Given a multi-game parlay where **one** leg’s game is canceled/postponed, when settlement rules are applied, then behavior matches the spec’s **void** policy (see Edge Cases)—and points math is reproducible from stored snapshots + version.
- Given settlement completes, when the parlay is scored, then **exactly one** points ledger row exists for that parlay (no per-leg duplicate points).
- Given a user attempts an **SGP** with a **disallowed** combo, the API returns **400** with a stable `code` (e.g. `SGP_COMBO_NOT_ALLOWED`).
- Given a **single** spread/total **pushes**, when scored, then points delta is **0**, outcome is **push** (not scored as a win), and `singlesCurrentStreak` is unchanged.
- Given a **parlay** with at least one **push** and no losing legs, when settled, then the ticket is **re-priced** using remaining legs and does not lose solely because of pushes.
- Given a user already has a **pending single** on `(gameId, type, pick)`, when they submit a **parlay** containing that leg, then the API returns **400** with `MARKET_ALREADY_SINGLE` (or equivalent).
- Given a user already has a **pending parlay** including a leg on `(gameId, type, pick)`, when they submit a **single** on that market, then the API returns **400** with `MARKET_ALREADY_IN_PARLAY` (or equivalent).
- Given a user is in **parlay or SGP mode** on a game card, when a market button is **disabled** because that pick is already taken (pending single or duplicate leg rule), then a **tooltip** explains why (per **API / UX**).

## Edge Cases

### Push and void (policy — locked)

- **Singles:** Moneyline tie, spread push, total push → **push** (0 points; not win, not loss). `**singlesCurrentStreak`**: **unchanged**.
- **Parlays:** A pushing leg is **removed**; combined odds and points are **recomputed** from remaining legs. If **all** legs push → whole ticket **push** (0 points). If one leg loses → ticket **lost** (subject to parlay points rules). `**parlayLegCurrentStreak`:** push leg → **no** increment and **no** reset.

### Void / canceled games

- Treat like a **push at the leg level** unless a separate product rule applies (e.g. cancel entire ticket)—**MUST** document one policy in implementation (default: void leg removed like push).

### Ordering and timing

- Legs must be placed **before** any included game starts (reuse existing validation).
- If a game starts between legs during construction, **reject** submit (server-side check).

### Double exposure

- Covered by **Duplicate market (v1)** in Requirements: **no** overlapping single + parlay leg for the same `(userId, gameId, type, pick)` while either is pending.

### Same-game disallowed combos (starter set for v1)

Books vary; Pulse should start conservative and expand:

- **MUST NOT** allow two legs that are **logically identical** (same game, type, pick duplicate)—enforce on `ParlayLeg` for a given parlay.
- **SHOULD NOT** allow **both** moneyline and spread on the **same team** where the book would treat as nearly redundant (optional v1 block).
- **MUST** document which pairs are allowed vs blocked; tune with data later.

## Constraints

- **Stack:** Follow existing Prisma + Express + shared `points.ts` patterns; any new probability helpers live in `packages/shared` with tests.
- **Simplicity:** v1 correlation model should be **explainable in plain language** on the client (e.g. “Same-game picks are priced together—combined chance is higher than multiplying each side”).
- **Forbidden:** Silent use of naive independence for **SGP** final pricing.
- **Reproducibility:** Store enough on the ticket to recompute score without live odds: leg snapshots + pricing version + combined parameters.
- **Scope:** Do not change unrelated leaderboard/marketing copy; parlay framing should remain **non-gambling** (points only).

## Scoring model (normative for engineering)

### Plain English: how parlay points relate to singles

Pulse scores **singles** from each leg’s American odds: convert to **implied win probability** p (as a percent, 0–100), then **if the pick wins**, award about `10 × (100 / p)` points—**harder** picks (lower p) pay **more**. Losses use the same p in `calculateIncorrectPoints` (`[packages/shared/src/points.ts](../../packages/shared/src/points.ts)`).

A **parlay ticket is one atomic bet**, not “sum of leg points.” You **do not** add up what each leg would have paid as a single.

1. **Multi-game parlay (different games)**
  Legs are treated as **independent** (like a typical sportsbook parlay). Multiply each leg’s implied probability **as decimals**: if leg 1 is 60% and leg 2 is 50%, the chance **both** hit (if fair and independent) is 0.60 \times 0.50 = 0.30 → **30%**. That **combined** probability is the difficulty of the **whole ticket**. You then run the **same style** of win/loss formulas **once**, using that combined probability (or an equivalent synthetic “parlay odds” derived from it)—so one **ledger line** for the ticket. **Intuition:** hitting two -110-ish sides is much harder than hitting one, so the combined p is smaller and the **win payout in points** is larger than either leg alone—**without** double-awarding points per leg.
2. **Same-game parlay (SGP)**
  Legs in one game are **not** independent (e.g. favorite ML + over can move together). If you multiplied probabilities like multi-game, you would **pretend the ticket is harder than it really is** and **overpay** points. So the spec applies a **correlation adjustment**: the effective joint probability is **higher** than the naive product (closer to how books **shorten** SGP payouts). That makes the ticket’s **fair** win points **lower** than the naive product would imply—**unless** you use the adjusted P_{\text{sgp}} everywhere for scoring.
3. **Pushes**
  A pushing leg is dropped and the ticket is **re-priced** using only the remaining legs’ snapshots (same independence or SGP rules on the smaller set). **All legs push** → whole ticket is a push (**0** points).
4. **One leg left after pushes**
  Score like a **single** on that leg’s odds (same math as a standalone `Prediction`).
5. **Losing a parlay (any leg loses, after push handling)**
  The ticket is **wrong** as a whole—you do **not** sum per-leg losses. The spec uses the **same loss philosophy** as singles: `[calculateIncorrectPoints](../../packages/shared/src/points.ts)` scales the penalty with **implied probability**—for a parlay, use the **combined** win probability p_{\mathrm{combined}} (percent, same scale as singles): same formula shape as today, i.e. about `-(LOSS_MULTIPLIER) × (p_combined / 10)` with default `LOSS_MULTIPLIER` from shared constants (currently `1`). Here p_{\mathrm{combined}} is the joint chance the **whole** slip wins (independence product for multi-game, or P_{\text{sgp}} for same-game). **Effect:**  
  - **More legs** at typical prices **lowers** p_{\mathrm{combined}}, so a **missed** long-shot parlay usually **costs fewer points** than missing a single -110 pick, while a **hit** pays **more**—same asymmetry as singles (favorites hurt more when wrong; longshots hurt less).  
  - **Easier** parlays (higher p_{\mathrm{combined}}, e.g. many heavy favorites) **lose more points** when busted.  
   Implementation may convert p_{\mathrm{combined}} to **equivalent American odds** and call existing helpers, or add an implied-probability overload—behavior must match the formula above.

### Multi-game parlay (formal)

Let each leg i have American odds A_i at placement. Convert to implied probability p_i using Pulse’s existing American → implied mapping (`[calculateImpliedProbability](../../packages/shared/src/points.ts)`).

Under independence, the **joint** win probability is P_{\text{ind}} = \prod_i p_i.

**Points:** Apply the same **expected-value philosophy** as singles: e.g. compute **base win points** from P_{\text{ind}} using the same `10 × (100 / P)` style formula **once** for the ticket, and **loss** side using a documented extension (e.g. incorrect parlay loss scales with P_{\text{ind}} analogously to `calculateIncorrectPoints`). Exact formulas MUST be implemented in `packages/shared` with tests and referenced from `PointsService`.

### Same-game parlay

Let P_{\text{naive}} = \prod_i p_i (independence assumption—**not** final).

**v1 correlation adjustment (example shape—constants are tunable):**

P_{\text{sgp}} = \min\bigl( \alpha \cdot P_{\text{naive}}^{1/\beta}, P_{\text{cap}} \bigr)

with \alpha \ge 1, \beta \ge 1 chosen so that **typical** SGPs have **higher** joint probability than P_{\text{naive}} when legs are positively correlated—mirroring that books **shorten** payouts vs independence. Parameters MUST live in `[packages/shared/src/constants.ts](../../packages/shared/src/constants.ts)` (or env) and be unit-tested.

**Alternative acceptable v1:** A small **lookup table** for `(type, type)` pairs (e.g. `MONEYLINE` + `TOTAL`) returning a **correlation factor** applied to P_{\text{naive}}. Prefer tables if formulas are too opaque.

**MUST:** Document in code comments that this is an **approximation** of book SGP pricing, not a claim of market accuracy.

## API Contract (illustrative—finalize paths with routing conventions)

### `POST /api/parlays/quote` (optional but recommended)

**Request:**

```json
{
  "type": "MULTI_GAME",
  "legs": [
    { "gameId": "...", "type": "MONEYLINE", "pick": "home" },
    { "gameId": "...", "type": "SPREAD", "pick": "away" }
  ]
}
```

**Response:**

```json
{
  "type": "MULTI_GAME",
  "combinedImpliedProbability": 0.21,
  "pricingVersion": "parlay-v1",
  "sgpAdjustment": null
}
```

For `SAME_GAME`, `sgpAdjustment` includes enough detail to reproduce P_{\text{sgp}}.

### `POST /api/parlays`

Creates the ticket; persists snapshots + pricing version.

**Errors:**


| Condition                                        | HTTP | Code                       |
| ------------------------------------------------ | ---- | -------------------------- |
| Mixed same-game in `MULTI_GAME`                  | 400  | `PARLAY_INVALID_GAME_MIX`  |
| Disallowed SGP combo                             | 400  | `SGP_COMBO_NOT_ALLOWED`    |
| Game started / locked                            | 400  | `GAME_NOT_OPEN`            |
| Leg count not in **2–20**                        | 400  | `PARLAY_LEG_COUNT`         |
| Leg duplicates pending **single** on same market | 400  | `MARKET_ALREADY_SINGLE`    |
| **Single** duplicates pending **parlay** leg     | 400  | `MARKET_ALREADY_IN_PARLAY` |


### `GET /api/parlays` / `GET /api/parlays/:id`

Returns ticket status, legs, combined quote, settlement when available.

## Tasks (implementation phases)

Work can ship incrementally; later tasks assume earlier schema exists.

1. **Schema & types:** Add `Parlay` + `ParlayLeg` models with odds snapshots, `pricingVersion`, `type` (`MULTI_GAME` | `SAME_GAME`), `status`. Migrate `User`: rename `currentStreak` → `singlesCurrentStreak`, `longestStreak` → `singlesLongestStreak`; add `parlayLegCurrentStreak`, `parlayLegLongestStreak`, `largestParlayWinLegCount`. Update all readers/writers (e.g. `points.service`, stats, web types).
  **Files:** `apps/api/prisma/schema/*.prisma`, `packages/types` enums, consumers of streak fields.  
   **Done:** Migration applies; no references to old streak column names; types export cleanly.
2. **Shared pricing library:** Implement `quoteMultiGameParlay`, `quoteSameGameParlay` in `packages/shared` with exhaustive tests (independence math + SGP adjustment).
  **Files:** `packages/shared/src/parlay.ts` (new), `packages/shared/src/__tests__/parlay.test.ts`.  
   **Done:** Golden tests match hand-calculated examples.
3. **Parlay service:** Validation (game windows, leg counts, SGP allowlist/blocklist), **duplicate-market checks vs pending singles**, persistence, idempotency considerations.
  **Files:** `apps/api/src/services/parlays.service.ts` (new), `apps/api/src/routers/parlays.ts` (new).  
   **Done:** Create + get flows covered by integration tests; duplicate market returns `MARKET_ALREADY_SINGLE`.
4. **Singles push + schema:** Add explicit outcome for `Prediction` (push vs win vs loss); update `scorePrediction` to award 0 points on push and **only** call `singlesCurrentStreak` / `singlesLongestStreak` update on win/loss (not push).
  **Files:** `apps/api/prisma/schema/prediction.prisma`, `points.service.ts`, `score-game.service.ts`.  
   **Done:** Tests for ML tie, spread push, total push → 0 points, **singles** streak unchanged.
5. **Settlement:** Extend scoring pipeline so when **all** games for a parlay are resolved, compute per-leg outcomes, **drop pushes and recompute** pricing, final ticket result, **one** ledger entry; update `parlayLegCurrentStreak` / `parlayLegLongestStreak` and `largestParlayWinLegCount`.
  **Files:** `apps/api/src/services/score-game.service.ts` or new `parlay-scoring.service.ts`, job triggers.  
   **Done:** Parlay end-to-end test with mocked results including partial pushes.
6. **Web UI (parlay / SGP builder):** Bet slip / review screen showing combined price, leg list, toasts for submit errors (`MARKET_ALREADY`_*), and **tooltips on disabled market buttons** when in parlay or SGP mode (see **API / UX** + **UI copy**). Implement shared copy (e.g. `apps/web/src/lib/parlay-duplicate-market-copy.ts` or colocated with feature). Target the same control surface as today’s market grid—likely extending `[GameCardMarkets](../../apps/web/src/components/games/GameCardMarkets.tsx)` or a parlay-mode wrapper (disabled + `Tooltip` with `asChild` on `span` wrapping `Button` where needed).
  **Files:** `apps/web/src/components/games/` (or new parlay components), shared copy module.  
   **Done:** User can place and view a parlay; disabled “already picked” buttons in parlay/SGP mode show the duplicate-market rationale on hover; submit errors align with that copy.
7. **Predictions service:** On `createPrediction` / batch, reject if `(gameId, type, pick)` exists on any **pending** `ParlayLeg` for that user (`MARKET_ALREADY_IN_PARLAY`).
  **Files:** `apps/api/src/services/predictions.service.ts`, router tests.  
   **Done:** Integration test for conflict path.
8. **Docs:** Update `[.github/instructions/overview.instructions.md](../../.github/instructions/overview.instructions.md)` with parlays, push behavior, renamed streak fields, and duplicate-market rule (points-only, no wagering).

---

## Review checklist (from writing-specs skill)


| Dimension          | Status                                                                           |
| ------------------ | -------------------------------------------------------------------------------- |
| Problem clarity    | Parlays/SGP desired; gap vs standalone predictions explicit                      |
| Testable criteria  | Quote math, single ledger entry, SGP ≠ naive, blocked combos                     |
| Scope boundaries   | No real money, no new market types in this spec                                  |
| Observable done    | Users place parlays; tickets settle with one points outcome                      |
| Codebase alignment | References real files; singles push requires schema + scoring change (specified) |
| Terminology        | Parlay ticket, leg, SGP, multi-game vs same-game consistent                      |


