const { Pool } = require('pg');
require('dotenv').config();

let pool;

if (process.env.DATABASE_URL) {
  // ── Supabase / Remote PostgreSQL via connection string ────────────────────
  // pgbouncer=true is used for the pooler port (6543).
  // SSL is required by Supabase — rejectUnauthorized:false allows self-signed certs.
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
} else {
  // ── Local PostgreSQL fallback (individual env vars) ────────────────────────
  pool = new Pool({
    user    : process.env.DB_USER     || 'postgres',
    host    : process.env.DB_HOST     || 'localhost',
    database: process.env.DB_NAME     || 'odoo',
    password: process.env.DB_PASSWORD || 'postgres',
    port    : parseInt(process.env.DB_PORT || '5432'),
  });
}

pool.on('connect', () => {
  console.log('✔  PostgreSQL connected:', process.env.DATABASE_URL ? 'Supabase (remote)' : 'localhost (local)');
});

pool.on('error', (err) => {
  console.error('✗  Unexpected PostgreSQL pool error:', err.message);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
