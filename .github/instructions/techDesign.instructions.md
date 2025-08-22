# Pulse — Tech Stack Design (Authoritative Guide for Code Generation)

This document tells an AI code generator **exactly** what technology choices, patterns, boundaries, and conventions to use for Pulse. It is **stack‑specific** and **implementation‑ready**, while still allowing feature growth.

---

## 1) Objectives

- Provide a **deterministic** scaffolding and coding standard so generated code composes cleanly.
- Ensure tight **type‑safety end‑to‑end** via tRPC + Zod.
- Keep a **monorepo** with clear boundaries, local dev parity, and simple CI/CD.
- Make auth **first‑class** with Clerk across web + API.

---

## 2) Stack Overview

**Monorepo & Tooling**

- Package manager: **pnpm**
- Workspace layout: `apps/*`, `packages/*`
- TypeScript project references; base `tsconfig` in repo root
- Linting: **ESLint** (TypeScript), Formatting: **Prettier**
- Git hooks via **lint-staged** (optional but recommended)

**Frontend (apps/web)**

- **Vite** + **React** + **TypeScript**
- Styling: **Tailwind CSS**
- UI: **shadcn/ui** (radix‑based components), **lucide-react** icons
- Routing: **Tanstack Router**
- Data fetching/state: **tRPC React** + **TanStack Query**
- Forms & validation: **react-hook-form** + **zod**
- Auth: **Clerk** (`@clerk/clerk-react`)

**Backend (apps/api)**

- Runtime: **Node.js (ESM)**, Server: **Express**
- RPC: **tRPC** (Express adapter) with **Zod** validation
- Auth: **Clerk** (`@clerk/express`) middleware → auth in tRPC context
- CORS enabled for `apps/web` dev origin
- Persistence: **Prisma** ORM + **PostgreSQL** (primary DB)
- Background jobs (lightweight): in‑process schedulers or external cron → call API endpoint(s)

**Shared**

- Types shared via package exports (e.g., `@pulse/api` exports `AppRouter` **types** only)
- Absolute imports via baseUrl/paths
- Env management via `.env` files per app + deployment secrets

---

## 3) Repository Layout

/
├─ package.json # root scripts (pnpm, dev, build, lint)
├─ pnpm-workspace.yaml # workspaces: apps/, packages/
├─ tsconfig.base.json # shared TS config
├─ .eslintrc.cjs + .prettierrc # lint/format
├─ apps/
│ ├─ api/ # Express + tRPC + Clerk + Prisma
│ │ ├─ src/
│ │ │ ├─ index.ts # express server bootstrap
│ │ │ ├─ trpc/ # context, router, procedures
│ │ │ ├─ routers/ # domain routers (odds, users, admin, etc.)
│ │ │ ├─ integrators/ # external providers (natstat, etc.)
│ │ │ ├─ jobs/ # orchestration entry points
│ │ │ └─ services/ # persistence and domain services
│ │ ├─ prisma/ # schema.prisma, migrations, seed
│ │ └─ .env.example
│ └─ web/ # Vite + React + Tailwind + shadcn + tRPC client
│ ├─ src/
│ │ ├─ app/ # routing/layout shell
│ │ ├─ components/ # ui, shared widgets, hooks
│ │ ├─ features/ # feature folders (games, odds, auth)
│ │ ├─ lib/ # trpc client, utils
│ │ └─ styles/ # tailwind entry
│ └─ .env.example
└─ packages/
└─ config/ (optional) # shared eslint, tsconfig, tailwind presets

---

## 4) Environment Variables

**Global defaults**

- `NODE_ENV` = `development` | `production`
- `LOG_LEVEL` = `info` (default)

**Frontend (`apps/web/.env`)**

- `VITE_CLERK_PUBLISHABLE_KEY`
- `VITE_API_URL` (e.g., `http://localhost:4000/trpc`)

**Backend (`apps/api/.env`)**

- `PORT` (default `4000`)
- `CORS_ORIGIN` (dev: `http://localhost:5173`)
- `CLERK_SECRET_KEY`
- `DATABASE_URL` (PostgreSQL)
- `ADMIN_API_KEY` (protects admin/cron routes)
- Provider‑specific keys (e.g., for NatStat) live here as well

**Rules**

- Frontend must only consume `VITE_*` prefixed vars.
- Backend must never leak secrets to the client.
- Provide `.env.example` with placeholder keys in each app.

---

## 5) Conventions & Standards

**TypeScript**

- `strict` mode on; no `any` in production code.
- Shared types live near their domain; avoid “god” types package.

**tRPC**

- Define a **root router** (`appRouter`) composed of domain routers.
- Export **types** (`AppRouter`) for client inference; do **not** re‑export runtime server code to the web.
- Use `publicProcedure` and `protectedProcedure` with a Clerk‑derived auth guard.

**Validation**

- **Zod** everywhere at IO boundaries: request params, mutations, env parsing as needed.

**React**

- Feature‑first file structure inside `src/features/*`.
- Co-locate queries/mutations with components that use them.
- Keep server state in **TanStack Query**, not in global stores.

**Styling/UI**

- Tailwind utility‑first; theme via tokens.
- shadcn/ui for primitives; avoid ad‑hoc component APIs without design tokens.

**Naming**

- Files: kebab‑case; Types/Components: PascalCase; Functions/vars: camelCase.

**Errors/Logging**

- Human‑readable errors across boundaries; never throw raw provider payloads.
- Log **error**, **warn**, **info** with per‑request correlation id (if available).

---

## 6) Frontend Architecture (apps/web)

**App shell**

- `App` sets up query client, ClerkProvider, router, and tRPC provider.
- Routing via Tanstack Router, `createBrowserRouter`.

**Auth**

- Gate routes with `<SignedIn>` / `<SignedOut>` (Clerk).
- Use `<SignInButton/>`, `<UserButton/>` for defaults; can be themed.

**tRPC client**

- Use `httpBatchLink` targeting `VITE_API_URL`.
- Add `Authorization: Bearer <token>` header from Clerk session token when available.
- Always set `credentials: 'include'` to keep cookie‑based evolvability.

**State & data**

- Server data: TanStack Query (query keys: `['odds', league, date]`, etc).
- Local UI state: component state or minimal context; avoid global stores unless necessary.

**Forms**

- `react-hook-form` + `@hookform/resolvers/zod` for validation.

**Styling**

- Tailwind + shadcn; keep custom components in `src/components/ui/*`.

**Testing (web)**

- Component tests with **Vitest** + **Testing Library**.
- Basic route rendering tests; mock tRPC client responses.

---

## 7) Backend Architecture (apps/api)

**Server**

- Express app with JSON body parser and CORS configured for web origin.
- **Clerk** middleware added _before_ tRPC to populate `req.auth`.
- tRPC mounted at `/trpc` using the Express adapter.

**tRPC context & procedures**

- `createContext({ req })` returns `{ auth }` derived from Clerk middleware.
- `publicProcedure` is unauthenticated; `protectedProcedure` requires `auth.userId`.

**Persistence**

- **Prisma** with PostgreSQL.
- Use **composite unique keys** to enforce idempotency where applicable (e.g., odds lines).

**Jobs**

- Orchestrator functions (plain TS) callable via admin route or CLI.
- Scheduling handled by external cron (platform‑specific) hitting an admin endpoint, authenticated via `ADMIN_API_KEY`.

**Testing (api)**

- Unit tests: routers/procedures with mocked services.
- Integration: spin up a test DB (or use `DATABASE_URL` pointing to ephemeral database), run Prisma migrations, test end‑to‑end tRPC calls.

---

## 8) Security & Auth

- All sensitive operations must be behind `protectedProcedure` and/or admin routes requiring `ADMIN_API_KEY`.
- Validate all inputs with Zod to prevent mass assignment or unsafe queries.
- CORS: restrict to known origins in production.
- Do not log secrets; redact tokens/keys.

---

## 9) Build, Dev, and Scripts

**Root scripts (examples)**

- `dev` → runs `apps/api` and `apps/web` concurrently
- `dev:web`, `dev:api` → per‑app dev servers
- `build` → typecheck + build both apps
- `lint`, `format` → code quality

**API**

- Use `tsx` for local dev (watch mode) or `ts-node/tsup`; `tsc` for type‑checking.

**Web**

- Vite dev server on `5173`; preview on `4173` (default).

---

## 10) CI/CD (Outline)

- **CI**:
  - `pnpm install --frozen-lockfile`
  - `pnpm lint && pnpm -r typecheck`
  - `pnpm -r build`
  - (API) `prisma generate` + `prisma migrate deploy` in preview env
  - Run unit/integration tests
- **CD**:
  - Deploy `apps/web` (e.g., Vercel, Cloudflare)
  - Deploy `apps/api` (e.g., Fly.io, Render, Railway, AWS)
  - Set per‑app env vars in platform
  - Configure cron to hit admin endpoints as needed

---

## 11) Minimal Contracts (Must‑Keep)

**tRPC**

- `appRouter` is the only server contract the web imports (as **types**).
- Each domain feature has its own router in `apps/api/src/routers/*`.
- Zod schemas define input/output; no untyped I/O.

**Auth contract**

- Clerk session token forwarded by the web client as a Bearer token.
- tRPC context must expose `{ auth }` with `userId` for `protectedProcedure`.

**DB contract**

- Prisma schema contains composite unique indices that back all `upsert` operations relied upon by jobs/routers.

---

## 12) Acceptance Criteria (for the Stack)

- `pnpm dev` starts both servers; web can sign in via Clerk and call protected tRPC procedures successfully.
- Type inference works end‑to‑end: when a router schema changes, web auto‑types update without manual typings.
- New features can be generated by adding:
  - a router in `apps/api/src/routers/<feature>.ts`
  - a feature folder in `apps/web/src/features/<feature>/`
  - Zod schemas shared across boundary
- Linting, format, and type checks pass in CI; builds are reproducible with `pnpm`.

---

## 13) “For the AI Code Generator” Hints

- **Generate separate layers**: router (I/O) → service (domain) → persistence (Prisma).
- **Always** put Zod schemas next to procedures and reuse them across client/server when helpful.
- **Do not** import runtime server code into web; only import **types** (e.g., `AppRouter`) for client inference.
- **When adding a feature**:
  1. Create a tRPC router file in `apps/api/src/routers/<feature>.ts`
  2. Add it to `appRouter` composition.
  3. Scaffold a feature directory in `apps/web/src/features/<feature>/` with:
     - `routes.tsx` (route components)
     - `queries.ts` (tRPC hooks)
     - `components/` (UI pieces using shadcn)
  4. Wire links in the app shell navigation.
- **Keep endpoints predictable**: only `/trpc` for RPC; other admin utilities under `/admin/*` with API key.

---

## 14) Optional Enhancements (Future‑proofing)

- Add **OpenTelemetry** for tracing across API calls/jobs.
- Introduce a small **shared `@pulse/validation`** package for common Zod schemas.
- Add **e2e tests** with Playwright hitting a seeded environment.
- Introduce **feature flags** (e.g., `@vercel/flags` or a simple DB‑backed flag table).

---
