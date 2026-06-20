import { prisma } from '../prisma.js';

export const getOrdersByStatus = async (status) => {
  return await prisma.order.findMany({
    where: { status: status },
    orderBy: { createdAt: 'asc' },
    include: {
      orderItems: {
        include: {
          product: { select: { name: true } }
        }
      }
    }
  });
};

export const updateOrderStatus = async (orderId, newStatus) => {
  const parsedId = parseInt(orderId);
  
  // 1. Fetch current order details to inspect paymentMethod and tables
  const order = await prisma.order.findUnique({
    where: { id: parsedId },
    include: { tables: true }
  });

  if (!order) {
    throw new Error('Order not found');
  }

  let statusToApply = newStatus;
  
  // If the kitchen completes the order and it's prepaid via UPI, auto-transition to PAID
  if (newStatus === 'COMPLETED' && order.paymentMethod === 'UPI_QR') {
    statusToApply = 'PAID';
  }

  return await prisma.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: parsedId },
      data: { status: statusToApply },
      include: { tables: true }
    });

    // If the resolved status is PAID, free the associated tables if they don't have other active orders
    if (statusToApply === 'PAID' && updated.tables.length > 0) {
      for (const t of updated.tables) {
        const activeOrdersCount = await tx.order.count({
          where: {
            tables: { some: { id: t.id } },
            status: {
              in: ['TO_COOK', 'PREPARING', 'COMPLETED'],
            },
            id: { not: parsedId }
          },
        });

        if (activeOrdersCount === 0) {
          await tx.table.update({
            where: { id: t.id },
            data: { status: 'FREE' },
          });
        }
      }
    }

    return updated;
  });
};

export const toggleItemCompletion = async (itemId, currentCompletedStatus) => {
  return await prisma.orderItem.update({
    where: { id: parseInt(itemId) },
    data: { completed: !currentCompletedStatus }
  });
};
