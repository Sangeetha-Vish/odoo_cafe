import { prisma } from '../prisma.js';

export const getOrdersByStatus = async (status) => {
  return await prisma.orders.findMany({
    where: { status: status },
    orderBy: { created_at: 'asc' },
    include: {
      order_items: {
        include: {
          product: { select: { name: true } }
        }
      }
    }
  });
};

export const updateOrderStatus = async (orderId, newStatus) => {
  return await prisma.orders.update({
    where: { id: parseInt(orderId) },
    data: { status: newStatus }
  });
};

export const toggleItemCompletion = async (itemId, currentCompletedStatus) => {
  return await prisma.orderItems.update({
    where: { id: parseInt(itemId) },
    data: { completed: !currentCompletedStatus }
  });
};
