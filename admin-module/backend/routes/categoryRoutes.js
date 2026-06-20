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

// GET /categories
router.get('/', getCategories);

// GET /categories/:id
router.get('/:id', getCategory);

// POST /categories - Protected
router.post('/', authMiddleware, createCategory);

// PUT /categories/:id - Protected
router.put('/:id', authMiddleware, updateCategory);

// DELETE /categories/:id - Protected
router.delete('/:id', authMiddleware, deleteCategory);

module.exports = router;
