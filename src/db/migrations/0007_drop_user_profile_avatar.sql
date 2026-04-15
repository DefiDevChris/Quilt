-- Migration: 0007_drop_user_profile_avatar.sql
-- Purpose: Drop user_profiles.avatarUrl column.
--   User avatars have been removed from the application in favor of
--   name-initial badges derived from displayName.

ALTER TABLE "user_profiles" DROP COLUMN IF EXISTS "avatarUrl";
