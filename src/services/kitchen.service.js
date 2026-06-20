import { prisma } from '../prisma.js';

const normalizeOrder = (order) => ({
  id: order.id,
  status: order.status,
  notes: order.notes,
  customer_name: order.customerName,
  customerName: order.customerName,
  created_at: order.createdAt,
  createdAt: order.createdAt,
  table_id: order.tables?.[0]?.tableNumber || order.tables?.[0]?.id || null,
  tables: order.tables,
  items: order.orderItems.map((item) => ({
    id: item.id,
    quantity: item.quantity,
    completed: item.completed,
    status: item.status,
    notes: item.notes,
    product: item.product
      ? {
          name: item.product.name,
          categoryId: item.product.categoryId,
          category_id: item.product.categoryId,
          categoryName: item.product.category?.name || null,
        }
      : null,
  })),
  orderItems: order.orderItems,
});

export const getOrdersByStatus = async (status) => {
  const isArchive = status === 'COMPLETED';

  const orders = await prisma.order.findMany({
    where: isArchive
      ? { status: { in: ['COMPLETED', 'PAID'] } }
      : { status },
    orderBy: { createdAt: isArchive ? 'desc' : 'asc' },
    include: {
      tables: true,
      orderItems: {
        include: {
          product: {
            select: {
              name: true,
              categoryId: true,
              category: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  return orders.map(normalizeOrder);
};

export const updateOrderStatus = async (orderId, newStatus) => {
  return await prisma.order.update({
    where: { id: parseInt(orderId) },
    data: { status: newStatus },
    include: { tables: true },
  });
};

export const toggleItemCompletion = async (itemId, currentCompletedStatus) => {
  return await prisma.orderItem.update({
    where: { id: parseInt(itemId) },
    data: { completed: !currentCompletedStatus },
  });
};
