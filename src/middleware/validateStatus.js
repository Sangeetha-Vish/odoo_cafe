import { validTransitions } from '../utils/statusTransition.js';
import { prisma } from '../prisma.js';

export const validateStatusChange = async (req, res, next) => {
  const { id } = req.params;
  const { status: nextStatus } = req.body;

  try {
    const order = await prisma.orders.findUnique({
      where: { id: parseInt(id) },
      select: { status: true }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order records not found" });
    }

    const currentStatus = order.status;
    const allowed = validTransitions[currentStatus] || [];

    if (!allowed.includes(nextStatus)) {
      return res.status(400).json({
        success: false,
        message: `Status transition from ${currentStatus} to ${nextStatus} is blocked.`
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
