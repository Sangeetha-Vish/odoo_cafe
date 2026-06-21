const express = require('express');
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { authorizeRoles } = require('../middleware/authorizeUser');

const router = express.Router();

router.use(authorizeRoles(['admin']));

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
