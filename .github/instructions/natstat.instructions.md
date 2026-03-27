---
applyTo: '**'
---

# Pulse — NatStat Ingestion (High‑Level Outline)

Concise, implementation‑agnostic guidance for an AI code generator to integrate **National Statistical (NatStat)** prematch odds into Pulse. For endpoint names/paths and supported query parameters, consult the official endpoints directory: https://natstat.com/api-v4/endpoints. For additional context, refer to the NatStat API documentation: https://natstat.com/api-v4/docs.

---

## 1) Objectives & Scope

- Fetch **prematch** odds for three core markets: **moneyline**, **pointspread**, **over/under**.
- Normalize provider responses into a unified **Odds DTO**.
- **Upsert** into `Game` and `OddsLine` (no duplicates; reruns are safe/idempotent).
- Initial leagues: **MLB, NBA, NFL, NHL** (extensible to others later).
- Out of scope (for now): live/in‑play, player props, historical line movement.

---

## 2) Configuration (Environment‑Driven)

Define these runtime variables (names may be adapted to your stack):

- `NATSTAT_BASE_URL` (default `https://api4.natst.at`)
- `NATSTAT_API_KEY`
- `NATSTAT_AUTH_SCHEME` (one of: `x-api-key`, `bearer`, or `header:Name`)
- `NATSTAT_TIMEOUT_MS` (e.g., 10000)
- `NATSTAT_DEFAULT_SPORTS` (CSV; e.g., `MLB,NBA,NFL,NHL`)
- `NATSTAT_MAX_DAYS_AHEAD` (e.g., 3)
- `ADMIN_API_KEY` (to protect manual/cron endpoints)

**Auth header rules** for the request builder:

- `x-api-key` → set header `x-api-key: <key>`
- `bearer` → set header `Authorization: Bearer <key>`
- `header:Name` → set header `<Name>: <key>`

---

## 3) File/Module Layout (Suggested)

- `integrators/natstat/`
  - `client` — request builder (auth, timeout, retries, backoff).
  - `types` — shared types for events/lines and normalized DTOs.
  - `markets/` — loaders per market: `moneyline`, `pointspread`, `overunder`.
  - `normalize` — merges per‑market payloads into a single event‑centric DTO.
  - `index` — public entry points.
- `services/`
  - `games` — `findOrCreateGame` using provider ID or deterministic hash.
  - `odds` — `upsertOddsLine` keyed by `(gameId, book, market)`.
- `jobs/ingest-odds` — orchestrates calls, normalization, and upserts.
- `routes/admin/ingest-odds` — secured trigger for cron/manual runs.

Keep this structure language/framework‑agnostic; only enforce clear boundaries.

---

## 4) Provider Interaction Model

**Endpoints & parameters**

- Use NatStat’s documented odds endpoints for **moneyline**, **pointspread**, and **over/under**.
- Filter by `league` and `date` (YYYY‑MM‑DD) when supported.
- If an official **event ID** is provided, prefer it; otherwise, infer identity via `(homeTeam, awayTeam, startsAt)` with league and date context.
- Always verify current endpoint names/paths against NatStat’s endpoint directory before requests. :contentReference[oaicite:1]{index=1}

**Request policy**

- Set headers per `NATSTAT_AUTH_SCHEME`.
- Apply `NATSTAT_TIMEOUT_MS`.
- Retries: **one** retry on network errors and 5xx with **jittered backoff** (e.g., 200–800 ms).
- On **429**: do **not** retry immediately; log and exit so the scheduler can retry later.
- Log request/response metadata at INFO level (exclude secrets).

---

## 5) Data Contracts (Implementation‑Neutral)

**Normalized Event (pre‑DB)**

- `provider` = `"natstat"`
- `externalEventId` (string, may be empty if not supplied by provider)
- `league`, `sport`
- `startsAt` (ISO)
- `homeTeam`, `awayTeam`

**Normalized Line (per book/market)**

- `market` in `{ moneyline | pointspread | overunder }`
- `book` (string)
- For moneyline: `moneylineHome`, `moneylineAway` (American odds integers)
- For point spread: `spread` (float; **negative means home favored**), optional prices `spreadHomePrice`, `spreadAwayPrice`
- For total: `total` (float), optional `overPrice`, `underPrice`
- `updatedAt` (ISO; provider timestamp or current time)

**Identity & merging**

- Prefer `externalEventId`. Fallback: **deterministic hash** of `(league | date | home | away)`.
- Merge per‑market arrays into a single event‑centric DTO keyed by the chosen identity.

---

## 6) Persistence Strategy

**Game upsert**

- Key: `externalId = externalEventId || hash(league|date|home|away)`.
- Update `startsAt`, `teams`, and context on changes.

**OddsLine upsert**

- Composite unique key: `(gameId, book, market)`.
- Overwrite changed fields and update `updatedAt`.
- No historical records in this table; plan for an optional `OddsLineHistory` later.

---

## 7) Orchestration & Scheduling

- Job input: `{ date: YYYY-MM-DD, league: <string> }`.
- Steps:
  1. Load each market (moneyline, pointspread, over/under) from NatStat.
  2. Normalize each market → standardized DTOs.
  3. Merge DTOs by event identity.
  4. Upsert `Game` then `OddsLine` for each line.
- Scheduling:
  - Hourly **08:00–23:00 local**.
  - Increase cadence (e.g., every 10 minutes) on event days.
  - Add a **look‑ahead sweep** up to `NATSTAT_MAX_DAYS_AHEAD`.

**Admin trigger**

- Protected endpoint or CLI command requiring `ADMIN_API_KEY`.
- Accepts `date` and `league`; returns a summary `{ ok, counts }`.

---

## 8) Validation, Errors, and Observability

- Validate minimal required fields per market before upsert; **skip and log** malformed entries.
- Distinguish provider errors (4xx/5xx) vs. transport errors (timeouts/abort).
- Emit metrics:
  - requests by endpoint, success/error counts, latency
  - rows upserted per market/league/date
  - skipped/invalid events
- Centralize logs with a correlation ID per ingestion run.

---

## 9) Acceptance Criteria (Checklist)

- Calling the ingest trigger with valid `date`/`league` results in:
  - **One `Game`** per event identity.
  - **≤ 3 `OddsLine` rows** per event (one per market/book present).
  - Re‑invocation is **idempotent** (no duplicate rows; `updatedAt` advances when values change).
- UI is able to render spreads, totals, and moneylines **without provider‑specific logic**.
- System gracefully handles timeouts, 429s, and partial failures (with logs/metrics).

---

## 10) Extensibility & Next Steps

- Optional **line history** table (append‑only snapshots).
- **Circuit breakers**/provider health with auto‑backoff.
- Additional markets (team totals, alternate spreads) behind feature flags.
- Multi‑provider merge policy (best‑line selection, source attribution).

---

## 11) Implementation Hints for a Code Generator

- Use a single **request client** that:
  - Builds headers from `NATSTAT_AUTH_SCHEME`
  - Applies `NATSTAT_TIMEOUT_MS` and one retry with jitter
  - Parses JSON and raises structured errors
- Implement **three market loaders** using NatStat’s documented endpoints and parameters; keep names aligned with provider docs. :contentReference[oaicite:2]{index=2}
- Keep a **normalizer** that accepts market‑specific raw payloads and outputs the standardized DTOs described above.
- Use **upsert** operations guarded by unique constraints for idempotency.

---
