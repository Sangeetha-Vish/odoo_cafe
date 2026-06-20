const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false },
});

pool.on('connect', () => {
  console.log('[db] PostgreSQL connection established');
});

pool.on('error', (err) => {
  console.error('[db] Unexpected error on idle PostgreSQL client', err);
  process.exit(1);
});

module.exports = pool;
