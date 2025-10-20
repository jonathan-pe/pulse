-- CreateTable
CREATE TABLE "NatStatTeam" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "league" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NatStatTeam_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NatStatTeam_league_active_idx" ON "NatStatTeam"("league", "active");

-- CreateIndex
CREATE UNIQUE INDEX "NatStatTeam_league_code_key" ON "NatStatTeam"("league", "code");
