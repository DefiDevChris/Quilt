-- Migration: 0010_add_grid_granularity.sql
-- Purpose: Add the gridGranularity column and grid_granularity enum to the
--   projects table. The Drizzle schema declares this column but no migration
--   had ever been generated, causing /api/projects/[id] GET to fail with a
--   500 (column does not exist) and the Studio to be unable to load any
--   existing project.

DO $$ BEGIN
  CREATE TYPE "grid_granularity" AS ENUM('inch', 'half', 'quarter');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "projects"
  ADD COLUMN IF NOT EXISTS "gridGranularity" "grid_granularity" DEFAULT 'inch';
