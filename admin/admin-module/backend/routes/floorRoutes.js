const express = require('express');
const {
  getFloors,
  getFloor,
  createFloor,
  updateFloor,
  deleteFloor,
} = require('../controllers/floorController');
const { authorizeRoles } = require('../middleware/authorizeUser');

const router = express.Router();

router.use(authorizeRoles(['admin']));

// GET /floors
router.get('/', getFloors);

// GET /floors/:id
router.get('/:id', getFloor);

// POST /floors
router.post('/', createFloor);

// PUT /floors/:id
router.put('/:id', updateFloor);

// DELETE /floors/:id
router.delete('/:id', deleteFloor);

module.exports = router;
