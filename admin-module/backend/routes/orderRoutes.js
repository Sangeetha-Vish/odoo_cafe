const express = require('express');
const {
  getOrders,
  getOrder,
  createOrder,
  updateOrder
} = require('../controllers/orderController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /orders - Protected (admin/staff)
router.get('/', authMiddleware, getOrders);

// GET /orders/:id - Public (customers tracking their order, or staff)
router.get('/:id', getOrder);

// POST /orders - Public (customer ordering from table)
router.post('/', createOrder);

// PUT /orders/:id - Protected (admin/staff updating order status)
router.put('/:id', authMiddleware, updateOrder);

module.exports = router;
