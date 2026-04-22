-- Add widthIn and heightIn columns to blocks table for 1:1 sizing invariant
-- between Block Builder and design studio.
-- IMPORTANT: column identifiers MUST be double-quoted so that Postgres preserves
-- the camelCase casing used by the Drizzle schema. Unquoted identifiers are
-- folded to lowercase (widthin/heightin), which breaks all `blocks` queries.
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS "widthIn" numeric(5,2) NOT NULL DEFAULT '12';
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS "heightIn" numeric(5,2) NOT NULL DEFAULT '12';