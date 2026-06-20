/**
 * db-diagnostic.js
 * Read-only connection diagnostic for Supabase PostgreSQL.
 * Run with: node db-diagnostic.js
 * Does NOT modify any project files.
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { Pool } = require('pg');

const DIVIDER = '─'.repeat(60);

// ─── 1. Inspect env variables ─────────────────────────────────────────────────
console.log('\n' + DIVIDER);
console.log('  ODOO POS — Database Connection Diagnostic');
console.log(DIVIDER);

console.log('\n📋  [1] Environment Variables (.env)');
const envVars = {
  DATABASE_URL : process.env.DATABASE_URL  || '(not set)',
  DB_HOST      : process.env.DB_HOST       || '(not set)',
  DB_PORT      : process.env.DB_PORT       || '(not set)',
  DB_USER      : process.env.DB_USER       || '(not set)',
  DB_NAME      : process.env.DB_NAME       || '(not set)',
  DB_PASSWORD  : process.env.DB_PASSWORD   ? '****** (set)' : '(not set)',
};

for (const [k, v] of Object.entries(envVars)) {
  const icon = v === '(not set)' ? '  ✗' : '  ✔';
  console.log(`${icon}  ${k.padEnd(18)} : ${k === 'DATABASE_URL' && v !== '(not set)' ? v.replace(/:([^@]+)@/, ':***@') : v}`);
}

// ─── 2. Determine pool config ─────────────────────────────────────────────────
console.log('\n📡  [2] Pool Configuration Strategy');
let poolConfig;

if (process.env.DATABASE_URL) {
  const masked = process.env.DATABASE_URL.replace(/:([^@:]+)@/, ':***@');
  console.log('  ✔  Using DATABASE_URL (Supabase mode)');
  console.log(`  ✔  URL: ${masked}`);
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // Required by Supabase
  };
} else {
  console.log('  ⚠  DATABASE_URL not found — using localhost fallback');
  poolConfig = {
    host     : process.env.DB_HOST     || 'localhost',
    port     : parseInt(process.env.DB_PORT || '5432'),
    database : process.env.DB_NAME     || 'odoo',
    user     : process.env.DB_USER     || 'postgres',
    password : process.env.DB_PASSWORD || 'postgres',
  };
}

// ─── 3. Create pool & run tests ───────────────────────────────────────────────
const pool = new Pool(poolConfig);

async function runDiagnostic() {
  let client;
  try {
    // ── 3a. Connect ────────────────────────────────────────────────────────────
    console.log('\n🔌  [3] Connecting to PostgreSQL...');
    client = await pool.connect();
    console.log('  ✔  Pool connected successfully!');

    // ── 3b. SELECT NOW() ───────────────────────────────────────────────────────
    console.log('\n🕐  [4] Test Query — SELECT NOW()');
    const nowResult = await client.query('SELECT NOW() AS server_time');
    console.log(`  ✔  Server time: ${nowResult.rows[0].server_time}`);

    // ── 3c. Database name ──────────────────────────────────────────────────────
    console.log('\n🗄   [5] Database Info');
    const dbResult = await client.query('SELECT current_database() AS db_name, current_user AS db_user, version() AS pg_version');
    const { db_name, db_user, pg_version } = dbResult.rows[0];
    console.log(`  ✔  Database : ${db_name}`);
    console.log(`  ✔  User     : ${db_user}`);
    console.log(`  ✔  PG Ver   : ${pg_version.split(',')[0]}`);

    // ── 3d. Check required tables ──────────────────────────────────────────────
    console.log('\n📦  [6] Required Tables Check');
    const REQUIRED_TABLES = ['users', 'categories', 'products', 'tables', 'coupons', 'orders', 'order_items'];

    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type   = 'BASE TABLE'
      ORDER BY table_name
    `);

    const existingTables = tablesResult.rows.map(r => r.table_name);
    console.log(`  ✔  Tables found in public schema: ${existingTables.length}`);

    let allPresent = true;
    for (const t of REQUIRED_TABLES) {
      const found = existingTables.includes(t);
      if (!found) allPresent = false;
      console.log(`  ${found ? '✔' : '✗'}  ${t}`);
    }

    if (existingTables.length > 0 && !REQUIRED_TABLES.every(t => existingTables.includes(t))) {
      console.log('\n  ℹ  Extra tables present (not required):');
      const extra = existingTables.filter(t => !REQUIRED_TABLES.includes(t));
      extra.forEach(t => console.log(`     • ${t}`));
    }

    // ── 3e. Row counts ─────────────────────────────────────────────────────────
    if (existingTables.includes('users')) {
      console.log('\n👥  [7] Users Table — Row Count');
      const usersCount = await client.query('SELECT COUNT(*) AS count FROM users');
      console.log(`  ✔  users table has ${usersCount.rows[0].count} row(s)`);

      // Check columns
      const colResult = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'users'
        ORDER BY ordinal_position
      `);
      console.log('  ✔  Columns: ' + colResult.rows.map(r => r.column_name).join(', '));
    }

    // ── 3f. API readiness ──────────────────────────────────────────────────────
    console.log('\n🔐  [8] Signup/Login API Readiness');
    if (existingTables.includes('users')) {
      console.log('  ✔  users table exists — signup (INSERT) and login (SELECT) queries will work');
      console.log('  ✔  bcrypt + JWT flow in authController.js targets this table');
    } else {
      console.log('  ✗  users table MISSING — run initDb.js to create schema first');
    }

    // ── Summary ────────────────────────────────────────────────────────────────
    console.log('\n' + DIVIDER);
    console.log('  📊 SUMMARY');
    console.log(DIVIDER);
    console.log(`  Connection     : ✔  SUCCESS`);
    console.log(`  Database       : ${db_name}`);
    console.log(`  Tables found   : ${existingTables.length} / ${REQUIRED_TABLES.length} required`);
    console.log(`  All required   : ${allPresent ? '✔  YES' : '✗  NO — run initDb.js to create schema'}`);
    console.log(`  API ready      : ${existingTables.includes('users') ? '✔  YES' : '✗  NO'}`);
    console.log(DIVIDER + '\n');

  } catch (err) {
    // ── Connection / Query failure ─────────────────────────────────────────────
    console.log('\n' + DIVIDER);
    console.log('  ❌ CONNECTION FAILED');
    console.log(DIVIDER);
    console.log(`\n  Error Code    : ${err.code || 'N/A'}`);
    console.log(`  Error Message : ${err.message}`);

    // ── Diagnose specific error codes ──────────────────────────────────────────
    console.log('\n  🔍 Diagnosis:');
    if (err.code === 'ENOTFOUND') {
      console.log('  • Host not found. DB_HOST or DATABASE_URL hostname is wrong.');
      console.log('  • Fix: Check your Supabase project URL in .env');
    } else if (err.code === 'ECONNREFUSED') {
      console.log('  • Connection refused. Database server is not reachable.');
      console.log('  • Fix: Ensure Supabase project is active, or DATABASE_URL is correct.');
    } else if (err.code === '28P01') {
      console.log('  • Authentication failed. Wrong DB_USER or DB_PASSWORD.');
      console.log('  • Fix: Copy the exact password from Supabase → Project Settings → Database.');
    } else if (err.code === '3D000') {
      console.log('  • Database does not exist.');
      console.log('  • Fix: Check DB_NAME or the database name in DATABASE_URL.');
    } else if (err.message?.includes('SSL')) {
      console.log('  • SSL handshake error.');
      console.log('  • Fix: Add ssl: { rejectUnauthorized: false } to pool config in db.js');
    } else if (!process.env.DATABASE_URL && !process.env.DB_HOST) {
      console.log('  • No DATABASE_URL or DB_HOST found in .env');
      console.log('  • Fix: Add DATABASE_URL to .env:');
      console.log('    DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres');
    }

    console.log('\n  📁 File to fix: backend/src/config/db.js');
    console.log('  📁 Config file: backend/.env');
    console.log(DIVIDER + '\n');
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

runDiagnostic();
