-- AlterTable
ALTER TABLE "Prediction" ADD COLUMN     "bonusTier" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isCorrect" BOOLEAN,
ADD COLUMN     "oddsAtPrediction" JSONB,
ADD COLUMN     "processedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Result" ADD COLUMN     "scoredAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "currentStreak" INTEGER NOT NULL DEFAULT 0;
