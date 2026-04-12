---
applyTo: '**'
---

**Pulse** (this application) is a sports prediction app where users pick sides using real sportsbook-style odds, earn points from outcomes, and track personal progress. The experience is **personal-first**: stats and history are primary; a **community** view shows how others are doing as **context**, not as the main competitive goal. There is no real money, gambling, or prizes.

## Features

- Predict outcomes using consolidated sportsbook odds.
- **Odds-only scoring**: correct picks earn probability-based points; incorrect picks lose using the same implied-probability framework (see below).
- **No bonus tier**, **no volume-based point penalties** on wins, and **no daily prediction count cap** in product logic (abuse prevention may add rate limits later).
- **Daily reset hour** (`DAILY_RESET_HOUR_UTC`, default **10**): used for “today” stats, streak display windows, and similar—not a cap on how many picks you may place.
- Cosmetic **achievements** and **streaks** (streaks do not multiply points).
- Optional **community** listing (points-based ordering); not framed as a trophy ladder in the product UI.

## Point Scoring System

Authoritative defaults live in **`packages/shared/src/constants.ts`** (e.g. `DEFAULT_LOSS_MULTIPLIER`, `DAILY_RESET_HOUR_UTC`). Implementation uses **`packages/shared/src/points.ts`** on both API and web previews.

#### Core principles

1. **Risk / reward**: Rewards and losses derive from implied probability, not from “first pick of the day” or how many picks you made.
2. **Probability-based fairness**: Wins scale inversely with implied win probability; losses scale with implied probability so favorites hurt more when wrong.
3. **No scoring multipliers** tied to daily order, tiers, or pick count for wins.

#### Points calculation

**Implied probability (American odds):**

- Favorites (negative odds): `|odds| / (|odds| + 100) × 100`
- Underdogs (positive odds): `100 / (odds + 100) × 100`

**Correct prediction:**

```
basePoints = 10 × (100 / impliedProbability)
```

**Incorrect prediction:**

```
lossPoints = -1 × LOSS_MULTIPLIER × (impliedProbability / 10)
```

Where **`LOSS_MULTIPLIER`** defaults to **`DEFAULT_LOSS_MULTIPLIER`** in shared constants (currently **`1`**, overridable via config/env when wired).

**Correct prediction examples:**

- **-500** (~83% favorite): **+12** points (rounded as implemented)
- **-110** (~52% favorite): **+19** points
- **+150** (~40% underdog): **+25** points
- **+700** (~12.5% longshot): **+80** points

**Incorrect prediction examples** (with default **`LOSS_MULTIPLIER = 1`**):

- **-500**: about **-8.3** points
- **-110**: about **-5.2** points
- **+150**: about **-4.0** points
- **+700**: about **-1.25** points

**Intuition**: Missing a heavy favorite costs more than missing a longshot; that asymmetry is intentional.

#### Expected value (wins only, illustration)

For **correct picks only**, the win formula is chosen so that roughly **~10 points** expected value per pick at fair odds (illustrative):

- Example: heavy favorite **-300** → ~0.75 × 13.3 ≈ **10**
- Example: pick’em **+100** → ~0.50 × 20 = **10**
- Example: longshot **+700** → ~0.125 × 80 = **10**

When losses are included, EV depends on `LOSS_MULTIPLIER` and rounding; tune in product, not in this overview.

#### Anti-abuse (current vs planned)

- **Per-request batch limit** on `POST /predictions/batch` (Zod **max 20** items per request) to bound payload/work per call—not a daily cap.
- **Rate limiting** and stricter abuse controls: planned; not fully implemented as of this document.

## Achievements and progression

Achievements are **cosmetic** (badges, milestones). **Streaks** advance on **scored** picks according to service rules and are **not** a multiplier on points.

- Streak-related copy should match **`PointsService.updateSinglesStreak`** for standalone predictions (wins increment, losses reset, pushes unchanged) and **`PointsService.updateParlayLegStreak`** for parlay legs when those legs are scored.
- Leaderboard-style **rank** in user stats may exist as **optional context**; it is not the primary success metric in the UI.

## Parlays and same-game parlays (SGP)

- Users can place **parlay tickets** (multi-game or same-game) via `POST /api/parlays`. Legs are stored as **`ParlayLeg`** rows only (not duplicate `Prediction` rows).
- **Duplicate market (v1):** a user cannot have both a pending **single** (`Prediction` with no outcome yet) and a **pending parlay leg** on the same `(gameId, type, pick)`. API errors use stable codes such as **`MARKET_ALREADY_SINGLE`** / **`MARKET_ALREADY_IN_PARLAY`**.
- **Settlement:** when every leg’s game has a result, each leg resolves to win / loss / push like singles. Pushes are **removed** and the ticket is **re-priced** from remaining leg snapshots; the ticket then wins, loses, or pushes as a whole. **Exactly one** `PointsLedger` line is written per parlay with metadata (including `parlayId`).
- **Pushes (singles):** moneyline ties, spread pushes, and total pushes score as **`PUSH`** with **0** points; **`singlesCurrentStreak`** does not change.
- **Largest parlay win** and **parlay-leg streak** are tracked on the user record for achievements-style metrics; they do not multiply points.

## Future features

Under consideration or planned elsewhere: live odds refresh, more markets, challenges, etc. **Social** features (follows, pools, friend comparisons) are **out of scope** unless explicitly specified; if added later, prefer opt-in, user-scoped comparisons over zero-sum framing.

## Documentation

- When creating documentation, place artifacts under the appropriate `/docs` directory when applicable.
- READMEs may exist at app or package roots for setup and package overview.
