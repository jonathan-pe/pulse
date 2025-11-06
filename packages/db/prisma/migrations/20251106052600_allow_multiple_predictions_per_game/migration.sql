/*
  Warnings:

  - A unique constraint covering the columns `[userId,gameId,type,pick]` on the table `Prediction` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."Prediction_userId_gameId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Prediction_userId_gameId_type_pick_key" ON "Prediction"("userId", "gameId", "type", "pick");
