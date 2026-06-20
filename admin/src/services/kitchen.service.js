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
  const order = await prisma.order.update({
    where: { id: parseInt(orderId) },
    data: { status: newStatus },
    include: { tables: true }
  });

  if (newStatus === 'COMPLETED' && order.tables && order.tables.length > 0) {
    const tableIds = order.tables.map(t => t.id);
    await prisma.table.updateMany({
      where: { id: { in: tableIds } },
      data: { status: 'FREE' }
    });
  }

  return order;
};

export const toggleItemCompletion = async (itemId, currentCompletedStatus) => {
  return await prisma.orderItem.update({
    where: { id: parseInt(itemId) },
    data: { completed: !currentCompletedStatus }
  });
};
