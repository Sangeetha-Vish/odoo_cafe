const tableModel = require('../models/tableModel');
const floorModel = require('../models/floorModel');

// Matches the live "table_status" enum
const VALID_STATUSES = ['FREE', 'OCCUPIED'];

function validateTablePayload(body, { partial = false } = {}) {
  const errors = [];
  const { tableNumber, seats, floorId, status } = body;

  if (!partial || tableNumber !== undefined) {
    if (!tableNumber || !String(tableNumber).trim()) errors.push('table number is required');
  }
  if (!partial || floorId !== undefined) {
    if (!floorId) errors.push('floor is required');
  }
  if (!partial || seats !== undefined) {
    if (seats === undefined || seats === null || isNaN(Number(seats)) || Number(seats) <= 0) {
      errors.push('seats must be a positive number');
    }
  }
  if (!partial || status !== undefined) {
    if (!VALID_STATUSES.includes(status)) {
      errors.push(`status must be one of: ${VALID_STATUSES.join(', ')}`);
    }
  }
  return errors;
}

async function getTables(req, res, next) {
  try {
    const { search, floorId, status } = req.query;
    const tables = await tableModel.findAll({ search, floorId, status });
    return res.status(200).json({ success: true, data: tables });
  } catch (err) {
    return next(err);
  }
}

async function getTable(req, res, next) {
  try {
    const table = await tableModel.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }
    return res.status(200).json({ success: true, data: table });
  } catch (err) {
    return next(err);
  }
}

async function createTable(req, res, next) {
  try {
    const errors = validateTablePayload(req.body);
    if (errors.length) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const { tableNumber, seats, floorId, status } = req.body;

    const floor = await floorModel.findById(floorId);
    if (!floor) {
      return res.status(400).json({ success: false, message: 'Selected floor does not exist' });
    }

    const duplicate = await tableModel.findByFloorAndNumber(floorId, String(tableNumber).trim());
    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: `Table "${String(tableNumber).trim()}" already exists on this floor`,
      });
    }

    const table = await tableModel.create({
      tableNumber: String(tableNumber).trim(),
      seats: Number(seats),
      floorId,
      status,
    });

    req.app.get('io').emit('table:created', table);
    return res.status(201).json({ success: true, data: table });
  } catch (err) {
    return next(err);
  }
}

async function updateTable(req, res, next) {
  try {
    const existing = await tableModel.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }

    const errors = validateTablePayload(req.body);
    if (errors.length) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const { tableNumber, seats, floorId, status } = req.body;

    const floor = await floorModel.findById(floorId);
    if (!floor) {
      return res.status(400).json({ success: false, message: 'Selected floor does not exist' });
    }

    const duplicate = await tableModel.findByFloorAndNumber(floorId, String(tableNumber).trim(), req.params.id);
    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: `Table "${String(tableNumber).trim()}" already exists on this floor`,
      });
    }

    const table = await tableModel.update(req.params.id, {
      tableNumber: String(tableNumber).trim(),
      seats: Number(seats),
      floorId,
      status,
    });

    req.app.get('io').emit('table:updated', table);
    return res.status(200).json({ success: true, data: table });
  } catch (err) {
    return next(err);
  }
}

async function deleteTable(req, res, next) {
  try {
    const deleted = await tableModel.remove(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }

    req.app.get('io').emit('table:deleted', { id: deleted.id });
    return res.status(200).json({ success: true, message: 'Table deleted', data: { id: deleted.id } });
  } catch (err) {
    if (err.code === '23503') {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete this table — it is referenced by existing orders (see _OrderTables).',
      });
    }
    return next(err);
  }
}

module.exports = { getTables, getTable, createTable, updateTable, deleteTable };
