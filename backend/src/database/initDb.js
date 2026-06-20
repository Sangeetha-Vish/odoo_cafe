const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function initializeDatabase() {
  console.log('Initializing database schema and seeding...');
  try {
    // Resolve SQL file paths
    const schemaPath = path.join(__dirname, '..', '..', 'database', 'schema.sql');
    const seedPath = path.join(__dirname, '..', '..', 'database', 'seed.sql');

    // Read files
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    const seedSql = fs.readFileSync(seedPath, 'utf8');

    // Start transaction to execute both
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      console.log('Executing schema.sql...');
      await client.query(schemaSql);
      
      console.log('Executing seed.sql...');
      await client.query(seedSql);
      
      await client.query('COMMIT');
      console.log('Database initialization and seeding completed successfully!');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error during database initialization:', err);
    process.exit(1);
  } finally {
    // End the pool so the process can exit
    await pool.end();
  }
}

if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;
