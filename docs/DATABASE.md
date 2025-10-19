# Database Setup Guide

This project uses PostgreSQL as its database. For local development, we use Docker Compose to run a PostgreSQL instance.

## Quick Start (Local Development)

### Prerequisites
- Docker and Docker Compose installed
- pnpm installed

### Setup Steps

1. **Start the PostgreSQL database**
   ```bash
   pnpm db:up
   ```
   This starts a PostgreSQL container on port 5432 and Adminer (database UI) on port 8080.

2. **Copy environment files**
   ```bash
   # For the database package
   cp packages/db/.env.example packages/db/.env
   
   # For the API
   cp apps/api/.env.example apps/api/.env
   ```
   
   The default DATABASE_URL is already configured for local development:
   ```
   postgresql://pulse:pulse_dev_password@localhost:5432/pulse_dev
   ```

3. **Generate Prisma Client**
   ```bash
   pnpm db:generate
   ```

4. **Run database migrations**
   ```bash
   pnpm db:migrate
   ```

5. **(Optional) Seed the database**
   ```bash
   pnpm db:seed
   ```

6. **Start developing!**
   ```bash
   pnpm dev
   ```

## Available Database Commands

| Command | Description |
|---------|-------------|
| `pnpm db:up` | Start PostgreSQL and Adminer containers |
| `pnpm db:down` | Stop containers (keeps data) |
| `pnpm db:reset` | Stop containers and delete all data |
| `pnpm db:generate` | Generate Prisma Client from schema |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:studio` | Open Prisma Studio (database GUI) |
| `pnpm db:seed` | Seed database with initial data |

## Database Tools

### Adminer (Web UI)
- URL: http://localhost:8080
- Server: `postgres`
- Username: `pulse`
- Password: `pulse_dev_password`
- Database: `pulse_dev`

### Prisma Studio
```bash
pnpm db:studio
```
Opens at http://localhost:5555

## Docker Compose Services

The `docker-compose.yml` file defines:

1. **postgres** - PostgreSQL 16 database
   - Port: 5432
   - User: pulse
   - Password: pulse_dev_password
   - Database: pulse_dev
   - Volume: `pulse-postgres-data` (persists data between restarts)

2. **adminer** - Lightweight database management UI
   - Port: 8080
   - Alternative to pgAdmin or other database tools

## Migrating to Production (e.g., Supabase)

When you're ready to use a hosted database like Supabase:

1. **Update environment variables**
   ```bash
   # In apps/api/.env and packages/db/.env
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres"
   DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres"
   ```

2. **Run migrations on production**
   ```bash
   # Make sure DATABASE_URL points to production
   pnpm db:migrate
   ```

3. **No code changes needed!**
   The Prisma schema already supports both local and hosted databases.

## Troubleshooting

### Port 5432 already in use
If you have another PostgreSQL instance running:
```bash
# Stop local PostgreSQL (macOS)
brew services stop postgresql

# Or change the port in docker-compose.yml
ports:
  - '5433:5432'  # Use port 5433 instead
```

### Container won't start
```bash
# Check logs
docker-compose logs postgres

# Reset everything
pnpm db:reset
```

### Cannot connect to database
```bash
# Check if container is running
docker ps

# Verify health
docker-compose ps
```

### Reset database completely
```bash
# This deletes all data and volumes
pnpm db:reset

# Then re-run migrations
pnpm db:migrate
```

## Development Workflow

1. Make changes to Prisma schema files in `packages/db/prisma/schema/`
2. Create a migration: `pnpm db:migrate`
3. Prisma will automatically generate the client
4. Use the updated types in your code

## Data Persistence

- Data is stored in a Docker volume named `pulse-postgres-data`
- Running `pnpm db:down` stops the container but keeps data
- Running `pnpm db:reset` deletes all data
- Volume persists even if you delete containers manually

## Security Notes

**⚠️ These credentials are for LOCAL DEVELOPMENT ONLY**

- Never commit `.env` files to git (already in `.gitignore`)
- Never use these credentials in production
- Always use strong, unique passwords for production databases
- Consider using connection pooling (like Supabase) for production
