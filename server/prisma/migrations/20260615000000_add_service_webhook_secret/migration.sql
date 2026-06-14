-- Add per-service webhook secret used to authenticate inbound monitoring webhooks.
-- Existing rows are backfilled with a random value so the column can be NOT NULL;
-- new rows receive a cuid from Prisma Client.
ALTER TABLE "Service"
  ADD COLUMN IF NOT EXISTS "webhookSecret" TEXT;

UPDATE "Service"
  SET "webhookSecret" = replace(gen_random_uuid()::text, '-', '')
  WHERE "webhookSecret" IS NULL;

ALTER TABLE "Service"
  ALTER COLUMN "webhookSecret" SET NOT NULL;
