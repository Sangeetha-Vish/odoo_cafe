const express = require('express');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { authorizeRoles } = require('../middleware/authorizeUser');

const router = express.Router();

router.use(authorizeRoles(['admin']));

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
