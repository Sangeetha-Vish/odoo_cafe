import * as kitchenService from '../services/kitchen.service.js';
import { io } from '../socket/socket.js';

export const getKitchenOrders = async (req, res) => {
  try {
    const { status } = req.query;
    if (!status) return res.status(400).json({ message: "Status query parameter required" });
    const orders = await kitchenService.getOrdersByStatus(status);
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const patchOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedOrder = await kitchenService.updateOrderStatus(id, status);
    
    if (io) {
      io.emit("order-status-updated", { orderId: id, status });
    }

    res.status(200).json({ success: true, order: updatedOrder });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const patchItemStrikeThrough = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { currentStatus } = req.body; // boolean status tracker flag

    const updatedItem = await kitchenService.toggleItemCompletion(itemId, currentStatus);
    
    if (io) {
      io.emit("item-status-toggled", { itemId, completed: updatedItem.completed });
    }

    res.status(200).json({ success: true, item: updatedItem });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
