const express = require('express');
const {
  getTables,
  getTable,
  createTable,
  updateTable,
  deleteTable,
} = require('../controllers/tableController');
const { authorizeRoles } = require('../middleware/authorizeUser');

const router = express.Router();

router.use(authorizeRoles(['admin']));

// GET /tables
router.get('/', getTables);

// GET /tables/:id
router.get('/:id', getTable);

// POST /tables
router.post('/', createTable);

// PUT /tables/:id
router.put('/:id', updateTable);

// DELETE /tables/:id
router.delete('/:id', deleteTable);

module.exports = router;
