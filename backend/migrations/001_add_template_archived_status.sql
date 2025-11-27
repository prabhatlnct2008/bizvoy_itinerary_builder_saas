-- Migration: Add 'archived' status to template_status enum
-- Run this migration on existing databases before deploying the new code

-- For PostgreSQL:
-- ALTER TYPE templatestatus ADD VALUE 'archived';

-- For SQLite (development):
-- SQLite doesn't have enum types, so no migration needed.
-- The status column is just a string and will accept any value.

-- Verification query:
-- SELECT DISTINCT status FROM templates;
