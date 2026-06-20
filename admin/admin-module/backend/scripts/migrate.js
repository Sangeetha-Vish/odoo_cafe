/**
 * Creates the "floors" table and adds "floor_id" to "tables".
 * Safe to run multiple times (uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).
 * Usage: node scripts/migrate.js
 */
require('dotenv').config();
const pool = require('../config/db');

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Create floors table
    await client.query(`
      CREATE TABLE IF NOT EXISTS floors (
        id         SERIAL PRIMARY KEY,
        name       TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    console.log('[migrate] ✓ floors table ready');

    // 2. Add floor_id column to tables (FK to floors), keep existing "floor" text column intact
    await client.query(`
      ALTER TABLE tables
        ADD COLUMN IF NOT EXISTS floor_id INTEGER REFERENCES floors(id) ON DELETE SET NULL
    `);
    console.log('[migrate] ✓ tables.floor_id column ready');

    // 3. Backfill: for each distinct floor name in tables.floor, insert a floors row,
    //    then update tables.floor_id from it
    await client.query(`
      INSERT INTO floors (name)
        SELECT DISTINCT floor FROM tables
        WHERE floor IS NOT NULL AND floor <> ''
      ON CONFLICT (name) DO NOTHING
    `);
    console.log('[migrate] ✓ floors backfilled from tables.floor');

    await client.query(`
      UPDATE tables t
         SET floor_id = f.id
        FROM floors f
       WHERE f.name = t.floor
         AND t.floor_id IS NULL
    `);
    console.log('[migrate] ✓ tables.floor_id backfilled');

    // 4. Index for fast floor_id lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tables_floor_id ON tables(floor_id)
    `);
    console.log('[migrate] ✓ index on tables.floor_id ready');

    await client.query('COMMIT');
    console.log('[migrate] Migration complete.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[migrate] Failed, rolled back:', err.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
