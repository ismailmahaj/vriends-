-- AlterTable
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "categories" JSONB;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);

-- Backfill categories from legacy category string
UPDATE "products"
SET "categories" = jsonb_build_array(COALESCE(NULLIF(TRIM("category"), ''), 'Autres'))
WHERE "categories" IS NULL;
