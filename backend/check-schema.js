require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  const client = await pool.connect();
  try {
    // Check tables data
    const tables = await client.query(
      'SELECT id, table_number, seats, status, floor FROM tables ORDER BY id LIMIT 10'
    );
    console.log('=== TABLES in Supabase ===');
    if (tables.rows.length === 0) console.log('  (no records)');
    tables.rows.forEach(t =>
      console.log(`  id=${t.id} | number=${t.table_number} | seats=${t.seats} | status=${t.status} | floor=${t.floor}`)
    );

    // Check orders data
    const orders = await client.query(
      'SELECT id, customer_name, status, total FROM orders ORDER BY created_at DESC LIMIT 5'
    );
    console.log('\n=== ORDERS in Supabase ===');
    if (orders.rows.length === 0) console.log('  (no records)');
    orders.rows.forEach(o =>
      console.log(`  id=${o.id} | status=${o.status} | total=${o.total} | customer=${o.customer_name}`)
    );

    // Test the fixed getOrders query
    const getOrdersTest = await client.query(`
      SELECT o.*,
        COALESCE(
          json_agg(
            json_build_object('id', oi.id, 'product_id', oi.product_id,
              'quantity', oi.quantity, 'price', oi.price)
          ) FILTER (WHERE oi.id IS NOT NULL), '[]'
        ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT 3
    `);
    console.log('\n=== getOrders query test ===');
    console.log('  ✔  Query runs OK. Rows returned:', getOrdersTest.rows.length);

  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
