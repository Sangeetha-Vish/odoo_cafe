const categoryModel = require('../models/categoryModel');

const HEX_COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function validateCategoryPayload(body) {
  const errors = [];
  const { name, color } = body;

  if (!name || !String(name).trim()) errors.push('name is required');
  if (!color || !String(color).trim()) {
    errors.push('color is required');
  } else if (!HEX_COLOR_RE.test(String(color).trim())) {
    errors.push('color must be a hex value, e.g. #6366F1');
  }
  return errors;
}

async function getCategories(req, res, next) {
  try {
    const { search } = req.query;
    const categories = await categoryModel.findAll({ search });
    return res.status(200).json({ success: true, data: categories });
  } catch (err) {
    return next(err);
  }
}

async function getCategory(req, res, next) {
  try {
    const category = await categoryModel.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    return res.status(200).json({ success: true, data: category });
  } catch (err) {
    return next(err);
  }
}

async function createCategory(req, res, next) {
  try {
    const errors = validateCategoryPayload(req.body);
    if (errors.length) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const { name, color } = req.body;
    const category = await categoryModel.create({ name: name.trim(), color: color.trim() });

    req.app.get('io').emit('category:created', category);
    return res.status(201).json({ success: true, data: category });
  } catch (err) {
    return next(err);
  }
}

async function updateCategory(req, res, next) {
  try {
    const errors = validateCategoryPayload(req.body);
    if (errors.length) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const existing = await categoryModel.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const { name, color } = req.body;
    const category = await categoryModel.update(req.params.id, { name: name.trim(), color: color.trim() });

    req.app.get('io').emit('category:updated', category);
    return res.status(200).json({ success: true, data: category });
  } catch (err) {
    return next(err);
  }
}

async function deleteCategory(req, res, next) {
  try {
    const deleted = await categoryModel.remove(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    req.app.get('io').emit('category:deleted', { id: deleted.id });
    return res.status(200).json({ success: true, message: 'Category deleted', data: { id: deleted.id } });
  } catch (err) {
    // categories.id is referenced by products.category_id (NOT NULL, no ON DELETE)
    if (err.code === '23503') {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete this category — products still reference it. Reassign or delete those products first.',
      });
    }
    return next(err);
  }
}

module.exports = { getCategories, getCategory, createCategory, updateCategory, deleteCategory };
