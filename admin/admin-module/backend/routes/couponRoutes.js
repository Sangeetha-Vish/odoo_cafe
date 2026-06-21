const express = require('express');
const {
  getCoupons,
  getCoupon,
  createCoupon,
  deleteCoupon,
} = require('../controllers/couponController');
const { authorizeRoles } = require('../middleware/authorizeUser');

const router = express.Router();

router.use(authorizeRoles(['admin']));

// GET /coupons
router.get('/', getCoupons);

// GET /coupons/:id
router.get('/:id', getCoupon);

// POST /coupons
router.post('/', createCoupon);

// DELETE /coupons/:id
router.delete('/:id', deleteCoupon);

// Intentionally no PUT /coupons/:id — spec lists GET/POST/DELETE only.

module.exports = router;
