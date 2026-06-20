require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DIRECT_URL, ssl: { rejectUnauthorized: false } });

pool.query(
  "SELECT t.typname, e.enumlabel FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid ORDER BY t.typname, e.enumsortorder"
).then(r => {
  console.log('All enums in DB:');
  r.rows.forEach(row => console.log(`  ${row.typname}: ${row.enumlabel}`));
  pool.end();
}).catch(e => {
  console.error(e.message);
  pool.end();
});
