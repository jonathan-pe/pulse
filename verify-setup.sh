#!/bin/bash

# Pulse - Post-Setup Verification Script
# Run this after setup to verify everything is working

echo "🔍 Verifying Pulse Local Development Setup..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0

# Check function
check() {
    local exit_code=$1
    local message=$2
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $message"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $message"
        ((FAILED++))
    fi
}

# 1. Check Docker
echo "📦 Checking Docker..."
docker --version > /dev/null 2>&1
check $? "Docker installed"

docker-compose --version > /dev/null 2>&1 || docker compose version > /dev/null 2>&1
check $? "Docker Compose installed"

# 2. Check pnpm
echo ""
echo "📦 Checking pnpm..."
pnpm --version > /dev/null 2>&1
check $? "pnpm installed"

# 3. Check database container
echo ""
echo "🐘 Checking PostgreSQL..."
docker ps | grep pulse-postgres > /dev/null 2>&1
check $? "PostgreSQL container running"

# 4. Check database connection
echo ""
echo "🔌 Checking database connection..."
docker exec pulse-postgres pg_isready -U pulse -d pulse_dev > /dev/null 2>&1
check $? "Database is ready"

# 5. Check environment files
echo ""
echo "🔧 Checking environment files..."
[ -f "packages/db/.env" ]
check $? "packages/db/.env exists"

[ -f "apps/api/.env" ]
check $? "apps/api/.env exists"

[ -f "apps/web/.env" ]
check $? "apps/web/.env exists"

# 6. Check Prisma Client
echo ""
echo "🔨 Checking Prisma..."
[ -d "node_modules/@prisma/client" ]
check $? "Prisma Client generated"

# 7. Check migrations
echo ""
echo "📊 Checking migrations..."
docker exec pulse-postgres psql -U pulse -d pulse_dev -c "SELECT 1 FROM _prisma_migrations LIMIT 1;" > /dev/null 2>&1
check $? "Migrations table exists"

# 8. Check Adminer
echo ""
echo "🌐 Checking Adminer..."
docker ps | grep pulse-adminer > /dev/null 2>&1
check $? "Adminer container running"

# 9. Check ports
echo ""
echo "🔌 Checking ports..."
nc -z localhost 5432 > /dev/null 2>&1
check $? "PostgreSQL port (5432) accessible"

nc -z localhost 8080 > /dev/null 2>&1
check $? "Adminer port (8080) accessible"

# Summary
echo ""
echo "════════════════════════════════════════"
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! ($PASSED/$((PASSED + FAILED)))${NC}"
    echo ""
    echo "🚀 You're ready to develop!"
    echo ""
    echo "Next steps:"
    echo "  1. Update Clerk keys in apps/api/.env and apps/web/.env"
    echo "  2. Run 'pnpm dev' to start all services"
    echo ""
    echo "Useful commands:"
    echo "  • pnpm dev          - Start all services"
    echo "  • pnpm db:studio    - Open Prisma Studio"
    echo "  • http://localhost:8080 - Adminer (DB UI)"
else
    echo -e "${RED}❌ Some checks failed ($FAILED failed, $PASSED passed)${NC}"
    echo ""
    echo "To fix issues, try:"
    echo "  • ./setup-dev.sh     - Re-run setup"
    echo "  • pnpm db:reset      - Reset database"
    echo "  • pnpm db:up         - Start database"
fi
echo "════════════════════════════════════════"
