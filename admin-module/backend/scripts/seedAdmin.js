/**
 * Creates the first admin user using a bcrypt-hashed password.
 * Usage: npm run seed:admin
 * Reads SEED_ADMIN_NAME / SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD from .env
 *
 * NOTE: the live "users" table stores the hash in a column literally
 * named "password" (not "password_hash") and "role" is the Postgres
 * enum user_role ('admin' | 'staff' | 'chef').
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

async function seed() {
  const name = process.env.SEED_ADMIN_NAME || 'Super Admin';
  const email = (process.env.SEED_ADMIN_EMAIL || 'admin@example.com').toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345';

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows[0]) {
    console.log(`[seed] Admin with email ${email} already exists. Skipping.`);
    return process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const result = await pool.query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, 'ADMIN')
     RETURNING id, name, email, role`,
    [name, email, passwordHash]
  );

  console.log('[seed] Admin user created:', result.rows[0]);
  console.log(`[seed] Login with email="${email}" password="${password}"`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});
