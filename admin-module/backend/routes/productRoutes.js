const express = require('express');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /products
router.get('/', getProducts);

// GET /products/:id
router.get('/:id', getProduct);

// POST /products - Protected
router.post('/', authMiddleware, createProduct);

// PUT /products/:id - Protected
router.put('/:id', authMiddleware, updateProduct);

// DELETE /products/:id - Protected
router.delete('/:id', authMiddleware, deleteProduct);

module.exports = router;
