-- Add widthIn and heightIn columns to blocks table for 1:1 sizing invariant
-- between Block Builder and design studio
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS widthIn numeric(5,2) NOT NULL DEFAULT '12';
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS heightIn numeric(5,2) NOT NULL DEFAULT '12';