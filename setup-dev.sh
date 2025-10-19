#!/bin/bash

# Pulse Local Development Setup Script
# This script sets up everything needed for local development

set -e  # Exit on error

echo "🚀 Setting up Pulse for local development..."
echo ""

# Check prerequisites
echo "✓ Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Please install pnpm first."
    exit 1
fi

echo "✓ All prerequisites found!"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install
echo "✓ Dependencies installed!"
echo ""

# Copy environment files if they don't exist
echo "🔧 Setting up environment files..."

if [ ! -f "packages/db/.env" ]; then
    cp packages/db/.env.example packages/db/.env
    echo "✓ Created packages/db/.env"
else
    echo "⚠️  packages/db/.env already exists, skipping..."
fi

if [ ! -f "apps/api/.env" ]; then
    cp apps/api/.env.example apps/api/.env
    echo "✓ Created apps/api/.env"
else
    echo "⚠️  apps/api/.env already exists, skipping..."
fi

if [ ! -f "apps/web/.env" ]; then
    cp apps/web/.env.example apps/web/.env
    echo "✓ Created apps/web/.env"
else
    echo "⚠️  apps/web/.env already exists, skipping..."
fi

echo ""

# Start database
echo "🐘 Starting PostgreSQL database..."
pnpm db:up

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Generate Prisma Client
echo "🔨 Generating Prisma Client..."
pnpm db:generate
echo "✓ Prisma Client generated!"
echo ""

# Run migrations
echo "📊 Running database migrations..."
pnpm db:migrate
echo "✓ Migrations complete!"
echo ""

# Optional: Seed database
read -p "🌱 Would you like to seed the database with initial data? (y/N) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    pnpm db:seed
    echo "✓ Database seeded!"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Update apps/api/.env with your Clerk keys"
echo "   2. Update apps/web/.env with your Clerk publishable key"
echo "   3. Run 'pnpm dev' to start all services"
echo ""
echo "🔗 Useful links:"
echo "   - API: http://localhost:4000"
echo "   - Web: http://localhost:5173"
echo "   - Adminer (DB UI): http://localhost:8080"
echo "   - Prisma Studio: Run 'pnpm db:studio'"
echo ""
echo "📚 For more information, see DATABASE.md"
