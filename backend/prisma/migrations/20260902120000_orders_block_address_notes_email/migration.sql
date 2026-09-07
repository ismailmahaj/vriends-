-- User address + profile enrichment
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "first_name" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_name" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "street" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "house_number" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "box" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "postal_code" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "country" TEXT DEFAULT 'Belgique';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "delivery_instructions" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "internal_notes" TEXT;

-- Order enrichment: address snapshot, CGV, delivery
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "address_snapshot" JSONB;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "cgv_accepted_at" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "cgv_version" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "order_type" TEXT DEFAULT 'TAKEAWAY';

-- Line notes
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "line_note" TEXT;
ALTER TABLE "pos_order_items" ADD COLUMN IF NOT EXISTS "line_note" TEXT;

-- POS address snapshot (optional)
ALTER TABLE "pos_orders" ADD COLUMN IF NOT EXISTS "address_snapshot" JSONB;

-- Email logs
CREATE TABLE IF NOT EXISTS "email_logs" (
  "id" SERIAL PRIMARY KEY,
  "to_email" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "template" TEXT,
  "order_id" INTEGER,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "error" TEXT,
  "payload" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Address audit
CREATE TABLE IF NOT EXISTS "address_audits" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER,
  "order_id" INTEGER,
  "actor_id" INTEGER,
  "old_address" JSONB,
  "new_address" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Default settings (idempotent)
INSERT INTO "settings" ("key", "value", "updated_at")
VALUES
  ('orders_accepting', 'true', CURRENT_TIMESTAMP),
  ('orders_closed_message', 'Les commandes sont temporairement indisponibles. Merci de réessayer plus tard.', CURRENT_TIMESTAMP),
  ('orders_reopen_at', '', CURRENT_TIMESTAMP),
  ('pos_orders_accepting', 'true', CURRENT_TIMESTAMP),
  ('email_notify_to', 'info@vriendspoperinge.be', CURRENT_TIMESTAMP),
  ('email_notify_new_order', 'true', CURRENT_TIMESTAMP),
  ('email_notify_status_confirmed', 'true', CURRENT_TIMESTAMP),
  ('email_notify_status_preparing', 'true', CURRENT_TIMESTAMP),
  ('email_notify_status_ready', 'true', CURRENT_TIMESTAMP),
  ('email_notify_status_completed', 'true', CURRENT_TIMESTAMP),
  ('email_notify_status_cancelled', 'true', CURRENT_TIMESTAMP),
  ('pos_auto_print', 'false', CURRENT_TIMESTAMP),
  ('pos_auto_print_trigger', 'paid', CURRENT_TIMESTAMP),
  ('pos_auto_print_copies', '1', CURRENT_TIMESTAMP),
  ('pos_ticket_width_mm', '80', CURRENT_TIMESTAMP),
  ('cgv_version', '1.0', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;
