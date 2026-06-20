require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  // Use DIRECT_URL for ALTER TYPE
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function addKitchenRole() {
  const client = await pool.connect();
  try {
    console.log('Adding KITCHEN_EMPLOYEE to Role enum...');
    await client.query(`ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'KITCHEN_EMPLOYEE'`);
    console.log('Successfully added KITCHEN_EMPLOYEE to Role enum.');
  } catch (error) {
    console.error('Error modifying database:', error);
  } finally {
    client.release();
    pool.end();
  }
}

addKitchenRole();
