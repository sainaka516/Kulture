-- Migration: [DESCRIPTION]
-- Author: [YOUR_NAME]
-- Date: [DATE]

-- Validation checks before migration
DO $$ 
BEGIN
  -- Add validation checks here
  -- Example:
  -- IF EXISTS (SELECT 1 FROM "TableName" WHERE condition) THEN
  --   RAISE EXCEPTION 'Validation failed: [reason]';
  -- END IF;
END $$;

-- Backup data if needed
-- CREATE TABLE IF NOT EXISTS "_Backup_[TableName]" AS SELECT * FROM "[TableName]";

-- Safe operations first (adding new things)
-- Example: Adding new columns
-- ALTER TABLE "TableName" ADD COLUMN IF NOT EXISTS "new_column" TEXT;

-- Data migration
-- Example: Populating new columns
-- UPDATE "TableName" SET "new_column" = 'default_value';

-- Schema changes
-- Example: Modifying columns
-- ALTER TABLE "TableName" ALTER COLUMN "column_name" SET NOT NULL;

-- Dangerous operations last (dropping things)
-- Example: Dropping old columns
-- ALTER TABLE "TableName" DROP COLUMN IF EXISTS "old_column";

-- Verification
DO $$ 
BEGIN
  -- Add verification checks here
  -- Example:
  -- IF EXISTS (SELECT 1 FROM "TableName" WHERE "column" IS NULL) THEN
  --   RAISE EXCEPTION 'Verification failed: [reason]';
  -- END IF;
END $$; 