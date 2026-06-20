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
  return await prisma.order.update({
    where: { id: parseInt(orderId) },
    data: { status: newStatus }
  });
};

export const toggleItemCompletion = async (itemId, currentCompletedStatus) => {
  return await prisma.orderItem.update({
    where: { id: parseInt(itemId) },
    data: { completed: !currentCompletedStatus }
  });
};
