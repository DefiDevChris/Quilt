-- Add cognitoSub column to users table for stable Cognito identity lookup.
-- Nullable to support pre-migration users (backfilled on next sign-in).
ALTER TABLE "users" ADD COLUMN "cognitoSub" varchar(255) UNIQUE;
