# Getting Started with Pulse

Welcome to Pulse! This guide will get you up and running with local development in minutes.

## 🚀 Quick Start (Automated)

The fastest way to get started:

```bash
./setup-dev.sh
```

This script will:
1. Install all dependencies
2. Set up environment files
3. Start the PostgreSQL database
4. Run database migrations
5. Optionally seed the database

After setup completes, verify everything:

```bash
./verify-setup.sh
```

## 📋 Manual Setup

If you prefer to set things up manually:

### 1. Prerequisites

- **Node.js** 18+ and **pnpm** 8+
- **Docker** and **Docker Compose**
- **Git**

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Database Setup

```bash
# Start PostgreSQL container
pnpm db:up

# Copy environment files
cp packages/db/.env.example packages/db/.env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Run migrations
pnpm db:migrate

# (Optional) Seed database
pnpm db:seed
```

### 4. Configure Clerk Authentication

Get your Clerk keys from https://dashboard.clerk.com

**In `apps/api/.env`:**
```bash
CLERK_SECRET_KEY=sk_test_...
```

**In `apps/web/.env`:**
```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

### 5. Start Development Servers

```bash
pnpm dev
```

This starts:
- **API** on http://localhost:4000
- **Web** on http://localhost:5173
- **Marketing** on http://localhost:5174

## 🛠️ Development Tools

### Prisma Studio
Visual database editor:
```bash
pnpm db:studio
# Opens at http://localhost:5555
```

### Adminer
Lightweight database UI:
- URL: http://localhost:8080
- Server: `postgres`
- Username: `pulse`
- Password: `pulse_dev_password`
- Database: `pulse_dev`

### Database Commands

| Command | Description |
|---------|-------------|
| `pnpm db:up` | Start database |
| `pnpm db:down` | Stop database (keeps data) |
| `pnpm db:reset` | Reset database (deletes data) |
| `pnpm db:migrate` | Run migrations |
| `pnpm db:generate` | Generate Prisma Client |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm db:seed` | Seed database |

## 📁 Project Structure

```
pulse/
├── apps/
│   ├── api/          # Express API server
│   ├── web/          # React web app (Vite)
│   └── marketing/    # Marketing site
├── packages/
│   ├── db/           # Prisma schema & client
│   └── types/        # Shared TypeScript types
├── docker-compose.yml
└── setup-dev.sh
```

## 🔄 Common Workflows

### Making Database Changes

1. Edit schema in `packages/db/prisma/schema/*.prisma`
2. Create migration:
   ```bash
   pnpm db:migrate
   ```
3. Prisma Client is auto-generated
4. Use updated types in your code

### Adding a New API Route

1. Create router in `apps/api/src/routers/`
2. Add to `apps/api/src/trpcRouter.ts`
3. Types auto-update in frontend

### Adding UI Components

```bash
cd apps/web
pnpm dlx shadcn@latest add button card input
```

## 🐛 Troubleshooting

### Port 5432 Already in Use

Stop local PostgreSQL:
```bash
# macOS
brew services stop postgresql

# Or change port in docker-compose.yml
```

### Database Won't Start

```bash
# Check logs
docker-compose logs postgres

# Reset everything
pnpm db:reset
pnpm db:migrate
```

### Prisma Client Not Found

```bash
pnpm db:generate
```

### Type Errors After Schema Change

```bash
# Regenerate everything
pnpm db:generate
pnpm -r build
```

## 📚 Documentation

- [DATABASE.md](./DATABASE.md) - Database setup and management
- [MIGRATION_TO_SUPABASE.md](./MIGRATION_TO_SUPABASE.md) - Moving to production
- [README.md](./README.md) - Main project documentation

## 🎯 Next Steps

1. ✅ Complete setup
2. ✅ Verify with `./verify-setup.sh`
3. 📝 Update Clerk keys
4. 🚀 Run `pnpm dev`
5. 🌐 Open http://localhost:5173
6. 🎉 Start building!

## 💡 Tips

- **Hot Reload**: All apps support hot module replacement
- **TypeScript**: Full end-to-end type safety with tRPC
- **Database**: Use Prisma Studio for quick data inspection
- **Logs**: Check terminal output for errors
- **Clean Start**: Run `pnpm clean` if things get weird

## 🆘 Getting Help

- Check [GitHub Issues](https://github.com/jonathan-pe/pulse/issues)
- Review documentation files
- Run `./verify-setup.sh` to diagnose issues

## 🔐 Security Notes

**⚠️ Important:**
- Never commit `.env` files (already in `.gitignore`)
- Default credentials are for LOCAL DEVELOPMENT ONLY
- Use strong, unique passwords in production
- Keep Clerk keys secret

---

Happy coding! 🚀
