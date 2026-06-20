const couponModel = require('../models/couponModel');

// Matches the live "coupon_type" enum
const VALID_TYPES = ['percentage', 'fixed'];

function validateCouponPayload(body) {
  const errors = [];
  const { code, type, value } = body;

  if (!code || !String(code).trim()) errors.push('code is required');
  if (!VALID_TYPES.includes(type)) {
    errors.push(`type must be one of: ${VALID_TYPES.join(', ')}`);
  }
  if (value === undefined || value === null || isNaN(Number(value)) || Number(value) < 0) {
    errors.push('value must be a non-negative number');
  }
  if (type === 'percentage' && Number(value) > 100) {
    errors.push('percentage value cannot exceed 100');
  }
  return errors;
}

async function getCoupons(req, res, next) {
  try {
    const coupons = await couponModel.findAll();
    return res.status(200).json({ success: true, data: coupons });
  } catch (err) {
    return next(err);
  }
}

async function getCoupon(req, res, next) {
  try {
    const coupon = await couponModel.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }
    return res.status(200).json({ success: true, data: coupon });
  } catch (err) {
    return next(err);
  }
}

async function createCoupon(req, res, next) {
  try {
    const errors = validateCouponPayload(req.body);
    if (errors.length) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const existing = await couponModel.findByCode(req.body.code.trim().toUpperCase());
    if (existing) {
      return res.status(409).json({ success: false, message: 'Coupon code already exists' });
    }

    const { code, type, value } = req.body;
    const coupon = await couponModel.create({
      code: code.trim(),
      type,
      value: Number(value),
    });

    req.app.get('io').emit('coupon:created', coupon);
    return res.status(201).json({ success: true, data: coupon });
  } catch (err) {
    return next(err);
  }
}

async function deleteCoupon(req, res, next) {
  try {
    const deleted = await couponModel.remove(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    req.app.get('io').emit('coupon:deleted', { id: deleted.id });
    return res.status(200).json({ success: true, message: 'Coupon deleted', data: { id: deleted.id } });
  } catch (err) {
    return next(err);
  }
}

// NOTE: No updateCoupon/PUT handler — matches the spec's
// GET/POST/DELETE /coupons route list, and the live coupons
// table has no fields (is_active/expires_at) to toggle anyway.

module.exports = { getCoupons, getCoupon, createCoupon, deleteCoupon };
