import express from 'express';
import { getKitchenOrders, patchOrderStatus, patchItemStrikeThrough } from '../controllers/kitchen.controller.js';
import { validateStatusChange } from '../middleware/validateStatus.js';
import { authorizeRoles } from '../../shared/auth/backend/authorizeUser.js';

const router = express.Router();

const kitchenOnly = authorizeRoles(['kitchen_employee']);

router.get('/kitchen/orders', kitchenOnly, getKitchenOrders);
router.patch('/orders/:id/status', kitchenOnly, validateStatusChange, patchOrderStatus);
router.patch('/items/:itemId/toggle', kitchenOnly, patchItemStrikeThrough);

export default router;
