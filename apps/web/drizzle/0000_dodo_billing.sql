ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "dodo_customer_id" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "dodo_subscription_id" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "subscription_status" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "subscription_product_id" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "subscription_renews_at" timestamp;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "subscription_cancel_at_period_end" boolean DEFAULT false NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "user_dodo_customer_id_unique" ON "user" ("dodo_customer_id");
CREATE UNIQUE INDEX IF NOT EXISTS "user_dodo_subscription_id_unique" ON "user" ("dodo_subscription_id");
CREATE TABLE IF NOT EXISTS "dodo_webhook_event" (
  "id" text PRIMARY KEY NOT NULL,
  "type" text NOT NULL,
  "processed_at" timestamp DEFAULT now() NOT NULL
);
