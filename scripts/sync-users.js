import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
// We need the service role key to list users, or we can just fetch from DB since DIRECT_URL gives us postgres access!
import { Client } from 'pg';

async function main() {
  const client = new Client({ connectionString: process.env.DIRECT_URL });
  await client.connect();

  // Fetch all users from auth.users
  const result = await client.query('SELECT id, email, raw_user_meta_data FROM auth.users');
  
  for (const row of result.rows) {
    const id = row.id;
    const email = row.email;
    const name = row.raw_user_meta_data?.name || email.split('@')[0];
    let role = row.raw_user_meta_data?.role || 'customer';
    
    if (role === 'kitchen_employee') role = 'KITCHEN_EMPLOYEE';
    if (role === 'employee') role = 'EMPLOYEE';
    if (role === 'admin') role = 'ADMIN';
    if (role === 'customer') role = 'CUSTOMER';

    try {
      await prisma.user.upsert({
        where: { id },
        update: { name, email, role: role, password: 'password123' },
        create: { id, name, email, role: role, password: 'password123' }
      });
      console.log(`Synced user: ${email} -> ${role}`);
    } catch(err) {
      console.error(`Failed to sync ${email}:`, err.message);
    }
  }

  await client.end();
}

main().catch(console.error).finally(() => prisma.$disconnect());
