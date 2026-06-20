-- =========================================================
-- Migration: align admin module with the LIVE Supabase schema
-- =========================================================
-- This file is NON-DESTRUCTIVE. It does not DROP or ALTER any
-- existing table that other modules (orders, order_items, waitlist,
-- _OrderTables) already depend on, except to ADD the floor_id column
-- to "tables" and backfill it.
--
-- Run this once against your Supabase database, e.g.:
--   psql "$DATABASE_URL" -f backend/sql/migration_floors.sql
-- or paste it into the Supabase SQL editor.
-- =========================================================

-- ---------------------------------------------------------
-- 1. New table: floors
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS floors (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL UNIQUE,
    created_at  TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------
-- 2. Backfill: one floor row per distinct existing tables.floor value
--    (skips if "tables" has no rows yet)
-- ---------------------------------------------------------
INSERT INTO floors (name)
SELECT DISTINCT floor FROM tables
WHERE floor IS NOT NULL
ON CONFLICT (name) DO NOTHING;

-- ---------------------------------------------------------
-- 3. Add floor_id to tables, FK'd to floors, kept in sync with
--    the existing "floor" text column (which is NOT removed —
--    other modules may read tables.floor directly).
-- ---------------------------------------------------------
ALTER TABLE tables
    ADD COLUMN IF NOT EXISTS floor_id INTEGER REFERENCES floors(id) ON DELETE SET NULL;

UPDATE tables t
SET floor_id = f.id
FROM floors f
WHERE f.name = t.floor
  AND t.floor_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_tables_floor_id ON tables(floor_id);

-- ---------------------------------------------------------
-- 4. Trigger: whenever floor_id changes (table moved to a
--    different floor in the admin UI), keep the legacy
--    "floor" text column in sync automatically — so any other
--    module still reading tables.floor directly keeps working.
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION sync_table_floor_text()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.floor_id IS NOT NULL THEN
        SELECT name INTO NEW.floor FROM floors WHERE id = NEW.floor_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_table_floor_text ON tables;
CREATE TRIGGER trg_sync_table_floor_text
    BEFORE INSERT OR UPDATE OF floor_id ON tables
    FOR EACH ROW
    EXECUTE FUNCTION sync_table_floor_text();

-- ---------------------------------------------------------
-- 5. If renaming a floor in the admin UI, propagate the new
--    name to every table currently pointing at it (keeps the
--    legacy text column accurate after an edit, not just a move).
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION sync_floor_name_to_tables()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.name IS DISTINCT FROM OLD.name THEN
        UPDATE tables SET floor = NEW.name WHERE floor_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_floor_name_to_tables ON floors;
CREATE TRIGGER trg_sync_floor_name_to_tables
    AFTER UPDATE OF name ON floors
    FOR EACH ROW
    EXECUTE FUNCTION sync_floor_name_to_tables();

-- ---------------------------------------------------------
-- Done. Nothing above touches users, categories, products,
-- coupons, orders, order_items, waitlist, or _OrderTables.
-- ---------------------------------------------------------
