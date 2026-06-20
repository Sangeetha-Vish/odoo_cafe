const orderModel = require('../models/orderModel');

async function getOrders(req, res, next) {
  try {
    const { tableId, status } = req.query;
    const orders = await orderModel.findAll({ tableId, status });
    return res.status(200).json({ success: true, data: orders });
  } catch (err) {
    return next(err);
  }
}

async function getOrder(req, res, next) {
  try {
    const order = await orderModel.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    return res.status(200).json({ success: true, data: order });
  } catch (err) {
    return next(err);
  }
}

async function createOrder(req, res, next) {
  try {
    const { customerName, subtotal, tax, discount, total, paymentMethod, status, notes, tableIds, items } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ success: false, message: 'At least one item is required' });
    }

    const orderId = await orderModel.create({
      customerName,
      subtotal: Number(subtotal),
      tax: Number(tax),
      discount: Number(discount),
      total: Number(total),
      paymentMethod,
      status: status || 'TO_COOK',
      notes,
      tableIds,
      items
    });

    const fullOrder = await orderModel.findById(orderId);

    // Emit Socket.IO events for real-time tracking
    const io = req.app.get('io');
    if (io) {
      io.emit('order:created', fullOrder);
      // Also emit table status update if tables were occupied
      if (tableIds && tableIds.length) {
        tableIds.forEach(tid => {
          io.emit('table:updated', { id: tid, status: 'OCCUPIED' });
        });
      }
    }

    return res.status(201).json({ success: true, data: fullOrder });
  } catch (err) {
    return next(err);
  }
}

async function updateOrder(req, res, next) {
  try {
    const { id } = req.params;
    const { status, paymentMethod } = req.body;

    const existing = await orderModel.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    let updatedOrder;
    if (paymentMethod !== undefined) {
      updatedOrder = await orderModel.updatePaymentAndStatus(id, { paymentMethod, status });
    } else {
      updatedOrder = await orderModel.updateStatus(id, status);
    }

    const io = req.app.get('io');
    if (io && updatedOrder) {
      io.emit('order:updated', updatedOrder);
      // Emit table:updated to free the tables if PAID
      if (status === 'PAID' && updatedOrder.tables) {
        updatedOrder.tables.forEach(t => {
          io.emit('table:updated', { id: t.id, status: 'FREE' });
        });
      }
    }

    return res.status(200).json({ success: true, data: updatedOrder });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getOrders,
  getOrder,
  createOrder,
  updateOrder
};
