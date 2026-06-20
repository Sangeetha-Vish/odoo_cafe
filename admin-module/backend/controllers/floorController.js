const floorModel = require('../models/floorModel');

async function getFloors(req, res, next) {
  try {
    const { search } = req.query;
    const floors = await floorModel.findAll({ search });
    return res.status(200).json({ success: true, data: floors });
  } catch (err) {
    return next(err);
  }
}

async function getFloor(req, res, next) {
  try {
    const floor = await floorModel.findById(req.params.id);
    if (!floor) {
      return res.status(404).json({ success: false, message: 'Floor not found' });
    }
    return res.status(200).json({ success: true, data: floor });
  } catch (err) {
    return next(err);
  }
}

async function createFloor(req, res, next) {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Floor name is required' });
    }

    const floor = await floorModel.create({ name: name.trim() });

    req.app.get('io').emit('floor:created', floor);
    return res.status(201).json({ success: true, data: floor });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ success: false, message: 'A floor with this name already exists' });
    }
    return next(err);
  }
}

async function updateFloor(req, res, next) {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Floor name is required' });
    }

    const existing = await floorModel.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Floor not found' });
    }

    const floor = await floorModel.update(req.params.id, { name: name.trim() });

    req.app.get('io').emit('floor:updated', floor);
    return res.status(200).json({ success: true, data: floor });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ success: false, message: 'A floor with this name already exists' });
    }
    return next(err);
  }
}

async function deleteFloor(req, res, next) {
  try {
    const existing = await floorModel.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Floor not found' });
    }

    const tableCount = await floorModel.countTables(req.params.id);
    if (tableCount > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete "${existing.name}" — it still has ${tableCount} table(s). Move or delete them first.`,
      });
    }

    const deleted = await floorModel.remove(req.params.id);

    req.app.get('io').emit('floor:deleted', { id: deleted.id });
    return res.status(200).json({ success: true, message: 'Floor deleted', data: { id: deleted.id } });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getFloors, getFloor, createFloor, updateFloor, deleteFloor };
