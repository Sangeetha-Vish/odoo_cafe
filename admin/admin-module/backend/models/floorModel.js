const pool = require('../config/db');

async function findAll({ search } = {}) {
  let query = 'SELECT id, name FROM floors';
  const values = [];

  if (search) {
    values.push(`%${search}%`);
    query += ` WHERE name ILIKE $1`;
  }

  query += ' ORDER BY name ASC';
  const result = await pool.query(query, values);
  return result.rows;
}

async function findById(id) {
  const result = await pool.query('SELECT id, name FROM floors WHERE id = $1', [id]);
  return result.rows[0] || null;
}

async function findByName(name) {
  if (!name) return null;
  const result = await pool.query('SELECT id, name FROM floors WHERE LOWER(name) = LOWER($1)', [name]);
  return result.rows[0] || null;
}

async function create({ name }) {
  try {
    const result = await pool.query(
      'INSERT INTO floors (name) VALUES ($1) RETURNING id, name',
      [name]
    );
    return result.rows[0];
  } catch (err) {
    if (err.code === '23505') {
      throw { code: '23505', message: 'A floor with this name already exists' };
    }
    throw err;
  }
}

async function update(id, { name }) {
  try {
    const result = await pool.query(
      'UPDATE floors SET name = $1 WHERE id = $2 RETURNING id, name',
      [name, id]
    );
    return result.rows[0] || null;
  } catch (err) {
    if (err.code === '23505') {
      throw { code: '23505', message: 'A floor with this name already exists' };
    }
    throw err;
  }
}

async function remove(id) {
  const result = await pool.query('DELETE FROM floors WHERE id = $1 RETURNING id, name', [id]);
  return result.rows[0] || null;
}

async function countTables(id) {
  const result = await pool.query(
    'SELECT COUNT(*)::int AS count FROM tables WHERE floor_id = $1',
    [id]
  );
  return result.rows[0].count;
}

module.exports = { findAll, findById, findByName, create, update, remove, countTables };
