import { Client } from 'pg';
import fs from 'fs';
import 'dotenv/config';

async function main() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL,
  });
  await client.connect();

  const sql = fs.readFileSync('shared/auth/sql/handle_new_user_trigger.sql', 'utf8');
  await client.query(sql);
  console.log("Trigger recreated successfully.");
  await client.end();
}

main().catch(console.error);
