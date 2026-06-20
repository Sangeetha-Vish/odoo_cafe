const express = require('express');
const {
  getTables,
  getTable,
  createTable,
  updateTable,
  deleteTable,
} = require('../controllers/tableController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /tables
router.get('/', getTables);

// GET /tables/:id
router.get('/:id', getTable);

// POST /tables - Protected
router.post('/', authMiddleware, createTable);

// PUT /tables/:id - Protected
router.put('/:id', authMiddleware, updateTable);

// DELETE /tables/:id - Protected
router.delete('/:id', authMiddleware, deleteTable);

module.exports = router;
