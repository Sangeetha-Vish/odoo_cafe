require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function inspect() {
  const client = await pool.connect();
  try {
    // 1. Check which schema our users table is actually in
    const tableCheck = await client.query(`
      SELECT table_schema, table_name, table_type
      FROM information_schema.tables
      WHERE table_name = 'users'
      ORDER BY table_schema
    `);
    console.log('=== ALL "users" TABLES ACROSS ALL SCHEMAS ===');
    tableCheck.rows.forEach(r => console.log('  schema=' + r.table_schema + ' | table=' + r.table_name + ' | type=' + r.table_type));

    // 2. Check our public.users schema
    const ourColumns = await client.query(`
      SELECT column_name, data_type, udt_name, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'users'
      ORDER BY ordinal_position
    `);
    console.log('\n=== public.users COLUMNS ===');
    ourColumns.rows.forEach(c =>
      console.log('  ' + c.column_name.padEnd(15) + ' | type=' + (c.udt_name || c.data_type).padEnd(25) + ' | nullable=' + c.is_nullable)
    );

    // 3. Confirm Role enum values
    const roleEnum = await client.query(`
      SELECT enumlabel FROM pg_enum
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'Role')
      ORDER BY enumsortorder
    `);
    console.log('\n=== "Role" ENUM VALUES IN SUPABASE ===');
    roleEnum.rows.forEach(r => console.log('  ->', r.enumlabel));

    // 4. Try inserting CUSTOMER role
    console.log('\n=== TEST: INSERT with role CUSTOMER ===');
    try {
      const r = await client.query(
        `INSERT INTO users (name, email, password, role)
         VALUES ($1, $2, $3, $4) RETURNING id, role`,
        ['Customer Test', 'custtest_' + Date.now() + '@verify.com', 'hashed', 'CUSTOMER']
      );
      console.log('  SUCCESS ->', JSON.stringify(r.rows[0]));
      await client.query("DELETE FROM users WHERE email LIKE 'custtest_%'");
    } catch(e) {
      console.log('  FAILED ->', e.message);
      console.log('  CODE   ->', e.code);
    }

    // 5. Test the exact INSERT our authController uses
    console.log('\n=== TEST: authController INSERT (EMPLOYEE) ===');
    const bcrypt = require('bcrypt');
    const hashed = await bcrypt.hash('123456', 10);
    try {
      const r = await client.query(
        `INSERT INTO users (name, email, password, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, email, role`,
        ['Test User', 'test@test.com', hashed, 'EMPLOYEE']
      );
      console.log('  SUCCESS ->', JSON.stringify(r.rows[0]));
      await client.query("DELETE FROM users WHERE email = 'test@test.com'");
      console.log('  Cleaned up test row.');
    } catch(e) {
      console.log('  FAILED ->', e.message);
      console.log('  DETAIL ->', e.detail || e.hint || '');
    }

  } finally {
    client.release();
    await pool.end();
  }
}

inspect().catch(err => {
  console.error('FATAL:', err.message);
  pool.end();
});
