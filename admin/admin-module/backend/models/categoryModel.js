const pool = require('../config/db');

async function findAll({ search } = {}) {
  if (search) {
    const result = await pool.query(
      `SELECT * FROM categories WHERE name ILIKE $1 ORDER BY created_at DESC`,
      [`%${search}%`]
    );
    return result.rows;
  }
  const result = await pool.query('SELECT * FROM categories ORDER BY created_at DESC');
  return result.rows;
}

async function findById(id) {
  const result = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
  return result.rows[0];
}

async function create({ name, color }) {
  const result = await pool.query(
    `INSERT INTO categories (name, color)
     VALUES ($1, $2)
     RETURNING *`,
    [name, color]
  );
  return result.rows[0];
}

async function update(id, { name, color }) {
  const result = await pool.query(
    `UPDATE categories
     SET name = $1, color = $2
     WHERE id = $3
     RETURNING *`,
    [name, color, id]
  );
  return result.rows[0];
}

async function remove(id) {
  const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING id', [id]);
  return result.rows[0];
}

module.exports = { findAll, findById, create, update, remove };
