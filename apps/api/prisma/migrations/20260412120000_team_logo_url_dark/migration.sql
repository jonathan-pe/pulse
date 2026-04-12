-- AlterTable
ALTER TABLE "Team" ADD COLUMN "logoUrlDark" TEXT;

-- Historical sync stored the dark-optimized URL in logoUrl; copy to logoUrlDark before backfilling light from NatStat.
UPDATE "Team" SET "logoUrlDark" = "logoUrl" WHERE "logoUrl" IS NOT NULL;

-- Backfill light logo from NatStat badge where available (same league + code).
UPDATE "Team" t
SET "logoUrl" = n."badgeUrl"
FROM "NatStatTeam" n
WHERE t."league" = n."league"
  AND upper(t."code") = upper(n."code")
  AND n."badgeUrl" IS NOT NULL;
