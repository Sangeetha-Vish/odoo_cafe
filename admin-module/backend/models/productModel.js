const pool = require('../config/db');

const BASE_SELECT = `
  SELECT
    p.id, p.name, p.price, p.tax, p.description,
    p.category_id, c.name AS category_name, c.color AS category_color,
    p.created_at
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
`;

async function findAll({ search, categoryId } = {}) {
  const conditions = [];
  const values = [];

  if (search) {
    values.push(`%${search}%`);
    conditions.push(`p.name ILIKE $${values.length}`);
  }
  if (categoryId) {
    values.push(categoryId);
    conditions.push(`p.category_id = $${values.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await pool.query(
    `${BASE_SELECT} ${where} ORDER BY p.created_at DESC`,
    values
  );
  return result.rows;
}

async function findById(id) {
  const result = await pool.query(`${BASE_SELECT} WHERE p.id = $1`, [id]);
  return result.rows[0];
}

// category_id is NOT NULL in the live schema — a product must belong to a category
async function create({ name, price, tax, description, categoryId }) {
  const result = await pool.query(
    `INSERT INTO products (name, price, tax, description, category_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [name, price, tax, description, categoryId]
  );
  return findById(result.rows[0].id);
}

async function update(id, { name, price, tax, description, categoryId }) {
  const result = await pool.query(
    `UPDATE products
     SET name = $1, price = $2, tax = $3, description = $4, category_id = $5
     WHERE id = $6
     RETURNING id`,
    [name, price, tax, description, categoryId, id]
  );
  if (!result.rows[0]) return null;
  return findById(id);
}

async function remove(id) {
  const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
  return result.rows[0];
}

module.exports = { findAll, findById, create, update, remove };
