const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('[db] DIRECT_URL or DATABASE_URL must be set in .env');
}

const isRemoteDb = /supabase|amazonaws|neon\.tech|render\.com/i.test(connectionString);

const pool = new Pool({
  connectionString,
  ssl: isRemoteDb ? { rejectUnauthorized: false } : false,
});

pool.on('connect', () => {
  console.log('[db] PostgreSQL connection established');
});

pool.on('error', (err) => {
  console.error('[db] Unexpected error on idle PostgreSQL client', err);
  process.exit(1);
});

module.exports = pool;
