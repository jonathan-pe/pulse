-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "awayTeamId" TEXT,
ADD COLUMN     "homeTeamId" TEXT,
ALTER COLUMN "homeTeam" DROP NOT NULL,
ALTER COLUMN "awayTeam" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "league" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "nickname" TEXT,
    "logoUrl" TEXT,
    "primaryColor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamProviderMapping" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "externalCode" TEXT,
    "externalName" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamProviderMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Team_league_idx" ON "Team"("league");

-- CreateIndex
CREATE UNIQUE INDEX "Team_league_code_key" ON "Team"("league", "code");

-- CreateIndex
CREATE INDEX "TeamProviderMapping_provider_externalCode_idx" ON "TeamProviderMapping"("provider", "externalCode");

-- CreateIndex
CREATE UNIQUE INDEX "TeamProviderMapping_provider_externalId_key" ON "TeamProviderMapping"("provider", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamProviderMapping_teamId_provider_key" ON "TeamProviderMapping"("teamId", "provider");

-- CreateIndex
CREATE INDEX "Game_homeTeamId_idx" ON "Game"("homeTeamId");

-- CreateIndex
CREATE INDEX "Game_awayTeamId_idx" ON "Game"("awayTeamId");

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamProviderMapping" ADD CONSTRAINT "TeamProviderMapping_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
