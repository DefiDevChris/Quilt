-- Migration: 0004_drop_social_tables.sql
-- Purpose: Remove all social/community tables and the comment_status enum.
--   Social threads feature has been fully removed from the application.
--   Tables: bookmarks, reports, likes, comments, follows, social_threads
--   Enum: comment_status

-- Drop child tables first (they have FKs pointing to social_threads / comments)
DROP TABLE IF EXISTS "bookmarks" CASCADE;
DROP TABLE IF EXISTS "reports" CASCADE;
DROP TABLE IF EXISTS "likes" CASCADE;
DROP TABLE IF EXISTS "comments" CASCADE;
DROP TABLE IF EXISTS "follows" CASCADE;

-- Drop the parent table
DROP TABLE IF EXISTS "social_threads" CASCADE;

-- Drop the orphaned enum type
DROP TYPE IF EXISTS "comment_status";
