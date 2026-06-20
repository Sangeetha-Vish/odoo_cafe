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

router.use(authMiddleware);

// GET /products
router.get('/', getProducts);

// GET /products/:id
router.get('/:id', getProduct);

// POST /products
router.post('/', createProduct);

// PUT /products/:id
router.put('/:id', updateProduct);

// DELETE /products/:id
router.delete('/:id', deleteProduct);

module.exports = router;
