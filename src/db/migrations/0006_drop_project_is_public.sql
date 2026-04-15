-- Migration: 0006_drop_project_is_public.sql
-- Purpose: Drop projects.isPublic column.
--   Public project sharing (/share/:id) has been removed from the application.

ALTER TABLE "projects" DROP COLUMN IF EXISTS "isPublic";
