/*
  Warnings:

  - You are about to drop the column `stakePoints` on the `Prediction` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,gameId]` on the table `Prediction` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Prediction" DROP COLUMN "stakePoints";

-- CreateIndex
CREATE INDEX "Prediction_userId_createdAt_idx" ON "Prediction"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Prediction_userId_gameId_key" ON "Prediction"("userId", "gameId");
