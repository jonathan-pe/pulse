-- CreateEnum
CREATE TYPE "ParlayTicketType" AS ENUM ('MULTI_GAME', 'SAME_GAME');
CREATE TYPE "ParlayTicketStatus" AS ENUM ('PENDING', 'WON', 'LOST', 'PUSHED');
CREATE TYPE "ParlayLegOutcome" AS ENUM ('WIN', 'LOSS', 'PUSH');
CREATE TYPE "PredictionOutcome" AS ENUM ('WIN', 'LOSS', 'PUSH');

-- AlterTable User: rename streak columns + parlay stats
ALTER TABLE "User" RENAME COLUMN "currentStreak" TO "singlesCurrentStreak";
ALTER TABLE "User" RENAME COLUMN "longestStreak" TO "singlesLongestStreak";
ALTER TABLE "User" ADD COLUMN "parlayLegCurrentStreak" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "parlayLegLongestStreak" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "largestParlayWinLegCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable Prediction: outcome replaces isCorrect
ALTER TABLE "Prediction" ADD COLUMN "outcome" "PredictionOutcome";

UPDATE "Prediction" SET "outcome" = CASE
  WHEN "isCorrect" IS NULL THEN NULL
  WHEN "isCorrect" = true THEN 'WIN'::"PredictionOutcome"
  ELSE 'LOSS'::"PredictionOutcome"
END;

ALTER TABLE "Prediction" DROP COLUMN "isCorrect";

-- CreateTable Parlay
CREATE TABLE "Parlay" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ticketType" "ParlayTicketType" NOT NULL,
    "status" "ParlayTicketStatus" NOT NULL DEFAULT 'PENDING',
    "pricingVersion" TEXT NOT NULL,
    "combinedImpliedProbability" DOUBLE PRECISION,
    "sgpMetadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "Parlay_pkey" PRIMARY KEY ("id")
);

-- CreateTable ParlayLeg
CREATE TABLE "ParlayLeg" (
    "id" TEXT NOT NULL,
    "parlayId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "type" "PredictionType" NOT NULL,
    "pick" TEXT NOT NULL,
    "oddsSnapshot" JSONB NOT NULL,
    "outcome" "ParlayLegOutcome",

    CONSTRAINT "ParlayLeg_pkey" PRIMARY KEY ("id")
);

-- Foreign keys
ALTER TABLE "Parlay" ADD CONSTRAINT "Parlay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ParlayLeg" ADD CONSTRAINT "ParlayLeg_parlayId_fkey" FOREIGN KEY ("parlayId") REFERENCES "Parlay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ParlayLeg" ADD CONSTRAINT "ParlayLeg_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Indexes
CREATE INDEX "Parlay_userId_status_idx" ON "Parlay"("userId", "status");
CREATE INDEX "Parlay_userId_createdAt_idx" ON "Parlay"("userId", "createdAt");
CREATE UNIQUE INDEX "ParlayLeg_parlayId_gameId_type_pick_key" ON "ParlayLeg"("parlayId", "gameId", "type", "pick");
CREATE INDEX "ParlayLeg_gameId_idx" ON "ParlayLeg"("gameId");
CREATE INDEX "ParlayLeg_parlayId_idx" ON "ParlayLeg"("parlayId");
