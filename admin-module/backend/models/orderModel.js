const pool = require('../config/db');

async function findAll({ tableId, status } = {}) {
  let query = `
    SELECT o.id, o.customer_name, o.subtotal, o.tax, o.discount, o.total, 
           o.payment_method, o.status, o.created_at, o.notes,
           COALESCE(
             json_agg(
               DISTINCT jsonb_build_object(
                 'id', t.id,
                 'table_number', t.table_number,
                 'seats', t.seats,
                 'status', t.status,
                 'floor', t.floor
               )
             ) FILTER (WHERE t.id IS NOT NULL),
             '[]'
           ) AS tables
    FROM orders o
    LEFT JOIN "_OrderTables" ot ON ot."A" = o.id
    LEFT JOIN tables t ON t.id = ot."B"
  `;

  const conditions = [];
  const values = [];

  if (tableId) {
    values.push(tableId);
    conditions.push(`ot."B" = $${values.length}`);
  }

  if (status) {
    values.push(status);
    conditions.push(`o.status = $${values.length}`);
  }

  if (conditions.length) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  query += `
    GROUP BY o.id
    ORDER BY o.created_at DESC
  `;

  const result = await pool.query(query, values);
  return result.rows;
}

async function findById(id) {
  const query = `
    SELECT o.id, o.customer_name, o.subtotal, o.tax, o.discount, o.total, 
           o.payment_method, o.status, o.created_at, o.notes,
           COALESCE(
             json_agg(
               DISTINCT jsonb_build_object(
                 'id', t.id,
                 'table_number', t.table_number,
                 'seats', t.seats,
                 'status', t.status,
                 'floor', t.floor
               )
             ) FILTER (WHERE t.id IS NOT NULL),
             '[]'
           ) AS tables
    FROM orders o
    LEFT JOIN "_OrderTables" ot ON ot."A" = o.id
    LEFT JOIN tables t ON t.id = ot."B"
    WHERE o.id = $1
    GROUP BY o.id
  `;
  const result = await pool.query(query, [id]);
  if (!result.rows[0]) return null;

  // Fetch items
  const itemsQuery = `
    SELECT oi.id, oi.order_id, oi.product_id, oi.quantity, oi.price, 
           oi.completed, oi.status, oi.notes,
           p.name AS product_name, p.description AS product_description
    FROM order_items oi
    LEFT JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = $1
    ORDER BY oi.id ASC
  `;
  const itemsResult = await pool.query(itemsQuery, [id]);
  result.rows[0].items = itemsResult.rows;

  return result.rows[0];
}

async function create({ customerName, subtotal, tax, discount, total, paymentMethod, status, notes, tableIds, items }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Insert order
    const orderRes = await client.query(
      `INSERT INTO orders (customer_name, subtotal, tax, discount, total, payment_method, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [customerName || null, subtotal, tax, discount, total, paymentMethod, status || 'TO_COOK', notes || null]
    );
    const orderId = orderRes.rows[0].id;

    // 2. Link tables in _OrderTables
    if (tableIds && tableIds.length) {
      for (const tableId of tableIds) {
        await client.query(
          `INSERT INTO "_OrderTables" ("A", "B") VALUES ($1, $2)`,
          [orderId, tableId]
        );
        // Mark table as OCCUPIED
        await client.query(
          `UPDATE tables SET status = 'OCCUPIED' WHERE id = $1`,
          [tableId]
        );
      }
    }

    // 3. Insert order items
    if (items && items.length) {
      for (const item of items) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, quantity, price, completed, status, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            orderId,
            item.productId,
            item.quantity,
            item.price,
            item.completed || false,
            item.status || 'TO_COOK',
            item.notes || null
          ]
        );
      }
    }

    await client.query('COMMIT');
    return orderId;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function updateStatus(id, status) {
  const result = await pool.query(
    `UPDATE orders SET status = $1 WHERE id = $2 RETURNING id`,
    [status, id]
  );
  if (!result.rows[0]) return null;

  // If status is completed or paid, maybe check if we want to free tables or do something, but let's just update the order status
  if (status === 'PAID') {
    // Free the associated tables
    const tableIdsRes = await pool.query(`SELECT "B" FROM "_OrderTables" WHERE "A" = $1`, [id]);
    for (const row of tableIdsRes.rows) {
      await pool.query(`UPDATE tables SET status = 'FREE' WHERE id = $1`, [row.B]);
    }
  }

  return findById(id);
}

async function updatePaymentAndStatus(id, { paymentMethod, status }) {
  const result = await pool.query(
    `UPDATE orders SET payment_method = $1, status = $2 WHERE id = $3 RETURNING id`,
    [paymentMethod, status, id]
  );
  if (!result.rows[0]) return null;

  if (status === 'PAID') {
    const tableIdsRes = await pool.query(`SELECT "B" FROM "_OrderTables" WHERE "A" = $1`, [id]);
    for (const row of tableIdsRes.rows) {
      await pool.query(`UPDATE tables SET status = 'FREE' WHERE id = $1`, [row.B]);
    }
  }

  return findById(id);
}

module.exports = {
  findAll,
  findById,
  create,
  updateStatus,
  updatePaymentAndStatus
};
