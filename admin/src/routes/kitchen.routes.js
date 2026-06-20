import express from 'express';
import { getKitchenOrders, patchOrderStatus, patchItemStrikeThrough } from '../controllers/kitchen.controller.js';
import { validateStatusChange } from '../middleware/validateStatus.js';

const router = express.Router();

router.get('/kitchen/orders', getKitchenOrders);
router.patch('/orders/:id/status', validateStatusChange, patchOrderStatus);
router.patch('/items/:itemId/toggle', patchItemStrikeThrough);

export default router;
