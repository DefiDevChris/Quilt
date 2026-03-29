-- Corrective migration: drop passwordHash from users
-- Auth is handled mostly by Cognito, making it obsolete.

ALTER TABLE "users" DROP COLUMN IF EXISTS "passwordHash";
