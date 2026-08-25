-- Categories enrichment
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "image_url" TEXT;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "icon" TEXT;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true;

-- Customer phone for POS search
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone" TEXT;
CREATE INDEX IF NOT EXISTS "users_phone_idx" ON "users"("phone");
CREATE INDEX IF NOT EXISTS "users_name_idx" ON "users"("name");
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users"("email");

-- Web orders: notes + richer items snapshots
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "notes" TEXT;

ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "product_name_snapshot" TEXT;
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "options_json" JSONB;
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "base_price" DOUBLE PRECISION;
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "options_extra" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Backfill snapshots from related products when possible
UPDATE "order_items" oi
SET "product_name_snapshot" = p."name",
    "base_price" = oi."price",
    "options_extra" = 0
FROM "products" p
WHERE oi."product_id" = p."id"
  AND oi."product_name_snapshot" IS NULL;

-- POS: link optional customer
ALTER TABLE "pos_orders" ADD COLUMN IF NOT EXISTS "customer_id" INTEGER;
DO $$ BEGIN
  ALTER TABLE "pos_orders"
    ADD CONSTRAINT "pos_orders_customer_id_fkey"
    FOREIGN KEY ("customer_id") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS "pos_orders_customer_id_idx" ON "pos_orders"("customer_id");
