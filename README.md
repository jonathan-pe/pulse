# Pulse

This is a minimal monorepo scaffold for **Pulse** using:

- **Frontend**: Vite, React, TypeScript, Tailwind CSS, (ready for shadcn/ui)
- **Backend**: Express
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: Clerk

## Quick start

### Automated Setup (Recommended)

```bash
# Run the setup script - it handles everything!
./setup-dev.sh
```

This script will:

- Install all dependencies
- Copy environment files
- Start the PostgreSQL database
- Run migrations
- Optionally seed the database

### Manual Setup

```bash
# 1) Install dependencies
pnpm install

# 2) Copy env files
cp packages/db/.env.example packages/db/.env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 3) Start PostgreSQL database
pnpm db:up

# 4) Run database migrations
pnpm db:migrate

# 5) Fill your Clerk keys
#   - apps/api/.env -> CLERK_SECRET_KEY=sk_...
#   - apps/web/.env -> VITE_CLERK_PUBLISHABLE_KEY=pk_...

# 6) Start dev servers
pnpm dev
# API on http://localhost:4000
# Web on http://localhost:5173
```

## Documentation

- **[Notion Documentation Hub](https://www.notion.so/2b1b971a5f65815ca215db86a24c75e2)** - Complete user-facing documentation
  - Getting Started, Database Setup, Testing Guide
  - API Endpoints, Auto-Scoring, CRON Schedules, CLI Commands
  - ESPN Integrator, Logger
  - Feature Roadmap
- **[Technical Context](./.github/TECHNICAL_CONTEXT.md)** - Architecture decisions, implementation patterns, and gotchas for developers/AI

## Database Management

Quick commands:

```bash
pnpm db:up          # Start PostgreSQL container
pnpm db:down        # Stop PostgreSQL container
pnpm db:migrate     # Run migrations
pnpm db:studio      # Open Prisma Studio
pnpm db:seed        # Seed the database
```

### shadcn/ui

Once the web app is running, you can install shadcn/ui components:

```bash
# from apps/web
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button card input
```

Tailwind is preconfigured; a simple `Button` is included as a placeholder until you add shadcn components.

---

## Updating dependencies safely

This repo includes helper scripts to update workspace dependencies and run verification steps.

From the repo root:

```bash
# Update all workspace deps to their latest matching versions
pnpm run update-deps

# Run a full install, build all packages and run typechecks
pnpm run update-and-verify
```

If anything breaks after updating, revert changes in `pnpm-lock.yaml` or restore from Git, then update individual packages selectively.

## Gotchas

1. For local dev, you might need to edit your `/etc/hosts` file in order to get the subdomains working

```bash
127.0.0.1      www.playpulse.test      # marketing site
127.0.0.1      app.playpulse.test      # actual app
```
