# Pulse

This is a minimal monorepo scaffold for **Pulse** using:

- **Frontend**: Vite, React, TypeScript, Tailwind CSS, (ready for shadcn/ui)
- **Backend**: Express
- **Auth**: Clerk

## Quick start

```bash
# 1) Install dependencies (use pnpm preferred)
pnpm install

# 2) Copy env files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 3) Fill your Clerk keys
#   - apps/api/.env -> CLERK_SECRET_KEY=sk_...
#   - apps/web/.env -> VITE_CLERK_PUBLISHABLE_KEY=pk_...

# 4) Dev servers
pnpm dev
# API on http://localhost:4000
# Web on http://localhost:5173
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
