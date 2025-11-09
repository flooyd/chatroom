-- Add email verification fields
ALTER TABLE "users" ADD COLUMN "verification_code" text;
ALTER TABLE "users" ADD COLUMN "is_verified" boolean DEFAULT false NOT NULL;
