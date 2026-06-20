const pool = require('../config/db');

async function findAll() {
  const result = await pool.query('SELECT * FROM coupons ORDER BY id DESC');
  return result.rows;
}

async function findById(id) {
  const result = await pool.query('SELECT * FROM coupons WHERE id = $1', [id]);
  return result.rows[0];
}

async function findByCode(code) {
  const result = await pool.query('SELECT * FROM coupons WHERE code = $1', [code]);
  return result.rows[0];
}

async function create({ code, type, value }) {
  const result = await pool.query(
    `INSERT INTO coupons (code, type, value)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [code.toUpperCase(), type, value]
  );
  return result.rows[0];
}

async function remove(id) {
  const result = await pool.query('DELETE FROM coupons WHERE id = $1 RETURNING id', [id]);
  return result.rows[0];
}

// NOTE: Per the module spec, coupons only expose GET/POST/DELETE — there is
// intentionally no update() / PUT here. If a coupon needs to change, delete
// it and create a new one.

module.exports = { findAll, findById, findByCode, create, remove };
