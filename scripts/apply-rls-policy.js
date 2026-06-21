import { Client } from 'pg';
import 'dotenv/config';

async function main() {
  const client = new Client({ connectionString: process.env.DIRECT_URL });
  await client.connect();

  console.log("Applying RLS policies to public.users table...");

  // Enable RLS on users table (it should already be enabled, but just in case)
  await client.query(`ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;`);

  // Drop existing policies to avoid conflicts
  await client.query(`DROP POLICY IF EXISTS "Users can read own profile" ON public.users;`);
  await client.query(`DROP POLICY IF EXISTS "Service role can read all users" ON public.users;`);
  await client.query(`DROP POLICY IF EXISTS "Allow authenticated users to read own row" ON public.users;`);

  // Allow authenticated users to SELECT their own row
  await client.query(`
    CREATE POLICY "Users can read own profile"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);
  `);

  console.log("✅ RLS policy created: authenticated users can read their own profile row.");
  console.log("   (The backend uses the service_role key which bypasses RLS entirely)");

  await client.end();
}

main().catch(console.error);
