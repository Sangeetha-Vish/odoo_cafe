/**
 * seed-users.js
 * ─────────────
 * One-time script to create the three default portal users in Supabase.
 * Run with:  npm run seed:users
 *
 * Uses the Supabase Auth REST API directly (no WebSocket / realtime needed).
 * Requirements: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in root .env
 */

import 'dotenv/config';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_ANON_KEY === 'your-anon-key-here') {
  console.error('\n❌  Missing credentials!');
  console.error('   Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your root .env file.\n');
  process.exit(1);
}

const USERS = [
  { email: 'cafe.admin@gmail.com',    password: 'password123', name: 'Admin User',    role: 'admin' },
  { email: 'cafe.employee@gmail.com', password: 'password123', name: 'Employee User', role: 'employee' },
  { email: 'cafe.kitchen@gmail.com',  password: 'password123', name: 'Kitchen Staff', role: 'kitchen_employee' },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function signUp(user) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      email: user.email,
      password: user.password,
      data: { name: user.name, role: user.role },
    }),
  });

  const json = await res.json();
  return { ok: res.ok, status: res.status, json };
}

async function seedUsers() {
  console.log('\n🌱  Seeding Supabase users...\n');

  for (let i = 0; i < USERS.length; i++) {
    const u = USERS[i];

    // Supabase rate-limits signups — wait 2s between each
    if (i > 0) await sleep(2000);

    const { ok, json } = await signUp(u);

    if (!ok) {
      const msg = json?.msg || json?.message || JSON.stringify(json);
      if (msg.toLowerCase().includes('already registered')) {
        console.log(`⚠️   ${u.email}  →  already exists, skipping.`);
      } else {
        console.error(`❌  ${u.email}  →  ${msg}`);
      }
    } else {
      console.log(`✅  ${u.email}  →  created (role: ${u.role})`);
      if (json.id && !json.access_token) {
        console.log(`    ℹ️   Check Supabase → Auth → Users → confirm this email if needed`);
      }
    }
  }

  console.log('\n📋  Default credentials:');
  console.log('   Admin     → cafe.admin@gmail.com    / password123  (port 5175)');
  console.log('   Employee  → cafe.employee@gmail.com / password123  (port 5174)');
  console.log('   Kitchen   → cafe.kitchen@gmail.com  / password123  (port 5173)');
  console.log('\n✔️   Done!\n');
}

seedUsers();
