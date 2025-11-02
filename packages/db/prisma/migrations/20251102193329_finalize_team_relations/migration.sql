/*
  Warnings:

  - You are about to drop the column `awayTeam` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `homeTeam` on the `Game` table. All the data in the column will be lost.
  - Made the column `awayTeamId` on table `Game` required. This step will fail if there are existing NULL values in that column.
  - Made the column `homeTeamId` on table `Game` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."Game" DROP CONSTRAINT "Game_awayTeamId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Game" DROP CONSTRAINT "Game_homeTeamId_fkey";

-- AlterTable
ALTER TABLE "Game" DROP COLUMN "awayTeam",
DROP COLUMN "homeTeam",
ALTER COLUMN "awayTeamId" SET NOT NULL,
ALTER COLUMN "homeTeamId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
