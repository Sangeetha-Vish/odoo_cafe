const productModel = require('../models/productModel');

function validateProductPayload(body, { partial = false } = {}) {
  const errors = [];
  const { name, price, tax, description, categoryId } = body;

  if (!partial || name !== undefined) {
    if (!name || !String(name).trim()) errors.push('name is required');
  }
  if (!partial || price !== undefined) {
    if (price === undefined || price === null || isNaN(Number(price)) || Number(price) < 0) {
      errors.push('price must be a non-negative number');
    }
  }
  if (!partial || tax !== undefined) {
    if (tax === undefined || tax === null || isNaN(Number(tax)) || Number(tax) < 0) {
      errors.push('tax must be a non-negative number');
    }
  }
  if (!partial || description !== undefined) {
    if (!description || !String(description).trim()) errors.push('description is required');
  }
  if (!partial || categoryId !== undefined) {
    if (!categoryId) errors.push('category is required');
  }
  return errors;
}

async function getProducts(req, res, next) {
  try {
    const { search, categoryId } = req.query;
    const products = await productModel.findAll({ search, categoryId });
    return res.status(200).json({ success: true, data: products });
  } catch (err) {
    return next(err);
  }
}

async function getProduct(req, res, next) {
  try {
    const product = await productModel.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    return res.status(200).json({ success: true, data: product });
  } catch (err) {
    return next(err);
  }
}

async function createProduct(req, res, next) {
  try {
    const errors = validateProductPayload(req.body);
    if (errors.length) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const { name, price, tax, description, categoryId } = req.body;
    const product = await productModel.create({
      name: name.trim(),
      price: Number(price),
      tax: Number(tax),
      description: description.trim(),
      categoryId,
    });

    req.app.get('io').emit('product:created', product);
    return res.status(201).json({ success: true, data: product });
  } catch (err) {
    if (err.code === '23503') {
      return res.status(400).json({ success: false, message: 'Selected category does not exist' });
    }
    return next(err);
  }
}

async function updateProduct(req, res, next) {
  try {
    const existing = await productModel.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const errors = validateProductPayload(req.body);
    if (errors.length) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const { name, price, tax, description, categoryId } = req.body;
    const product = await productModel.update(req.params.id, {
      name: name.trim(),
      price: Number(price),
      tax: Number(tax),
      description: description.trim(),
      categoryId,
    });

    req.app.get('io').emit('product:updated', product);
    return res.status(200).json({ success: true, data: product });
  } catch (err) {
    if (err.code === '23503') {
      return res.status(400).json({ success: false, message: 'Selected category does not exist' });
    }
    return next(err);
  }
}

async function deleteProduct(req, res, next) {
  try {
    const deleted = await productModel.remove(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    req.app.get('io').emit('product:deleted', { id: deleted.id });
    return res.status(200).json({ success: true, message: 'Product deleted', data: { id: deleted.id } });
  } catch (err) {
    if (err.code === '23503') {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete this product — it is referenced by existing orders.',
      });
    }
    return next(err);
  }
}

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct };
