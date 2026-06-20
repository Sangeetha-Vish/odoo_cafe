const express = require('express');
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// GET /categories
router.get('/', getCategories);

// GET /categories/:id
router.get('/:id', getCategory);

// POST /categories
router.post('/', createCategory);

// PUT /categories/:id
router.put('/:id', updateCategory);

// DELETE /categories/:id
router.delete('/:id', deleteCategory);

module.exports = router;
