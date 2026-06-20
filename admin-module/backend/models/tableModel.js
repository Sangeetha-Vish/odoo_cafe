const pool = require('../config/db');

const BASE_SELECT = `
  SELECT t.id, t.table_number, t.seats, t.status, t.floor_id,
         f.name AS floor_name
  FROM tables t
  LEFT JOIN floors f ON f.id = t.floor_id
`;

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    table_number: row.table_number,
    seats: row.seats,
    status: row.status,
    floor_id: row.floor_id,
    floor_name: row.floor_name || null,
  };
}

async function findAll({ search, floorId, status } = {}) {
  const conditions = [];
  const values = [];

  if (search) {
    values.push(`%${search}%`);
    conditions.push(`t.table_number ILIKE $${values.length}`);
  }

  if (floorId) {
    values.push(floorId);
    conditions.push(`t.floor_id = $${values.length}`);
  }

  if (status) {
    values.push(status);
    conditions.push(`t.status = $${values.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await pool.query(
    `${BASE_SELECT} ${where} ORDER BY f.name ASC, t.table_number ASC`,
    values
  );

  return result.rows.map(mapRow);
}

async function findById(id) {
  const result = await pool.query(`${BASE_SELECT} WHERE t.id = $1`, [id]);
  return mapRow(result.rows[0]);
}

async function findByFloorAndNumber(floorId, tableNumber, excludeId = null) {
  const values = [floorId, tableNumber];
  let query = `SELECT id FROM tables WHERE floor_id = $1 AND table_number = $2`;
  if (excludeId) {
    values.push(excludeId);
    query += ` AND id <> $3`;
  }
  const result = await pool.query(query, values);
  return result.rows[0] || null;
}

async function create({ tableNumber, seats, floorId, status }) {
  const result = await pool.query(
    `INSERT INTO tables (table_number, seats, floor_id, status)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [tableNumber, seats, floorId, status]
  );
  return findById(result.rows[0].id);
}

async function update(id, { tableNumber, seats, floorId, status }) {
  const result = await pool.query(
    `UPDATE tables
     SET table_number = $1, seats = $2, floor_id = $3, status = $4
     WHERE id = $5
     RETURNING id`,
    [tableNumber, seats, floorId, status, id]
  );
  if (!result.rows[0]) return null;
  return findById(id);
}

async function remove(id) {
  const result = await pool.query('DELETE FROM tables WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
}

module.exports = { findAll, findById, findByFloorAndNumber, create, update, remove };
