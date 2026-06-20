require('dotenv').config();
const { Pool } = require('pg');

// Use DIRECT_URL for DDL (ALTER TYPE) — pgbouncer doesn't support it
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

async function migrate() {
  const client = await pool.connect();
  console.log('Connected to Supabase (direct)');
  try {
    // Add CUSTOMER to the Role enum if it doesn't exist
    console.log('\nAdding CUSTOMER to Role enum...');
    await client.query(`ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'CUSTOMER'`);
    console.log('✔  CUSTOMER added to Role enum');

    // Verify
    const result = await client.query(`
      SELECT enumlabel FROM pg_enum
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'Role')
      ORDER BY enumsortorder
    `);
    console.log('✔  Role enum now contains:', result.rows.map(r => r.enumlabel).join(', '));
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(err => {
  console.error('Migration failed:', err.message);
  pool.end();
  process.exit(1);
});
