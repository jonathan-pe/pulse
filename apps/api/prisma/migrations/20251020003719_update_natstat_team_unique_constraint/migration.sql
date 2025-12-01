-- DropIndex
DROP INDEX "public"."NatStatTeam_league_code_key";

-- CreateIndex
CREATE INDEX "NatStatTeam_league_code_idx" ON "NatStatTeam"("league", "code");
