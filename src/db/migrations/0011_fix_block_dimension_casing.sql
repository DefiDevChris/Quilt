-- Migration: 0011_fix_block_dimension_casing.sql
-- Purpose: Migration 0009 created the block-dimension columns without
--   quoting the identifiers, so Postgres folded them to lowercase
--   (widthin / heightin). The Drizzle schema selects "widthIn" / "heightIn",
--   which made every `blocks` query fail with "column does not exist",
--   breaking the Blocks panel, block picker, and block-library in the studio.
--   This migration renames the columns to the correct camelCase form.

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blocks' AND column_name = 'widthin'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blocks' AND column_name = 'widthIn'
  ) THEN
    ALTER TABLE "blocks" RENAME COLUMN "widthin" TO "widthIn";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blocks' AND column_name = 'heightin'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blocks' AND column_name = 'heightIn'
  ) THEN
    ALTER TABLE "blocks" RENAME COLUMN "heightin" TO "heightIn";
  END IF;
END $$;
