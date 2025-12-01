-- Add book and market columns to GameOdds and create composite unique constraint
ALTER TABLE "GameOdds" ADD COLUMN IF NOT EXISTS "book" TEXT;
ALTER TABLE "GameOdds" ADD COLUMN IF NOT EXISTS "market" TEXT;

-- Create a unique index on (gameId, book, market). If duplicates exist this will fail; review data first.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE c.contype = 'u' AND t.relname = 'GameOdds' AND c.conname = 'GameOdds_gameId_book_market_key'
  ) THEN
    ALTER TABLE "GameOdds" ADD CONSTRAINT "GameOdds_gameId_book_market_key" UNIQUE ("gameId","book","market");
  END IF;
END$$;
