import express from 'express';
import { PrismaClient } from '@prisma/client';
import kitchenRoutes from './src/routes/kitchen.routes.js';
import { io } from './src/socket/socket.js';
import { authorizeRoles } from './src/middleware/authorizeUser.js';

const router = express.Router();
const prisma = new PrismaClient();

// Kitchen KDS routes — protected independently (kitchen_employee role)
router.use(kitchenRoutes);

const authEmployeeAdmin = authorizeRoles(['employee', 'admin']);

// 1. GET /api/products - Returns all products with their associated categories
router.get('/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
      },
      orderBy: {
        id: 'asc',
      },
    });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// 2. GET /api/products/:id - Returns a single product detail
router.get('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: { category: true },
    });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// 3. GET /api/tables - Fetches all tables
router.get('/tables', async (req, res) => {
  try {
    const tables = await prisma.table.findMany({
      include: {
        floors: true,
      },
      orderBy: {
        id: 'asc',
      },
    });

    // Normalise: prefer the floors relation name, fallback to floor string field
    const normalised = tables.map((t) => ({
      ...t,
      floor: t.floors?.name || t.floor || 'Unknown',
    }));

    res.json(normalised);
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});


// 4. POST /api/coupons/validate - Validate coupon code
router.post('/coupons/validate', async (req, res) => {
  try {
    const { code, cartTotal } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Coupon code is required' });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      return res.status(404).json({ error: 'Invalid coupon code' });
    }

    let discount = 0;
    if (coupon.type === 'PERCENTAGE') {
      discount = (cartTotal * coupon.value) / 100;
    } else if (coupon.type === 'FIXED') {
      discount = coupon.value;
    }

    discount = Math.min(discount, cartTotal);

    res.json({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discount: parseFloat(discount.toFixed(2)),
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    res.status(500).json({ error: 'Failed to validate coupon' });
  }
});

// 5. GET /api/orders - Fetches all orders with line items (supports filters like status) - PROTECTED
router.get('/orders', authEmployeeAdmin, async (req, res) => {
  try {
    const { status, tableId } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }
    if (tableId) {
      filter.tables = {
        some: {
          id: parseInt(tableId),
        },
      };
    }

    const orders = await prisma.order.findMany({
      where: filter,
      include: {
        tables: true,
        orderItems: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// 6. GET /api/orders/:id - Fetches detailed order information
router.get('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: {
        tables: true,
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// 7. POST /api/orders - Creates a new order supporting merged tables
router.post('/orders', async (req, res) => {
  try {
    const {
      tableIds, // Array of table IDs: e.g. [1, 2]
      customerName,
      notes,
      subtotal,
      tax,
      discount,
      total,
      paymentMethod,
      items, // array of { productId, quantity, price, notes }
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    const validTableIds = Array.isArray(tableIds) ? tableIds.filter(Boolean).map(id => parseInt(id)) : [];

    const newOrder = await prisma.$transaction(async (tx) => {
      // 1. Create order linking to tables
      const order = await tx.order.create({
        data: {
          customerName,
          notes: notes || null,
          subtotal: parseFloat(subtotal),
          tax: parseFloat(tax),
          discount: parseFloat(discount),
          total: parseFloat(total),
          paymentMethod,
          status: 'TO_COOK',
          tables: {
            connect: validTableIds.map((id) => ({ id })),
          },
          orderItems: {
            create: items.map((item) => ({
              productId: parseInt(item.productId),
              quantity: parseInt(item.quantity),
              price: parseFloat(item.price),
              completed: false,
              status: 'PENDING',
              notes: item.notes || null,
            })),
          },
        },
        include: {
          tables: true,
          orderItems: true,
        },
      });

      // 2. Mark all selected tables as OCCUPIED
      if (validTableIds.length > 0) {
        await tx.table.updateMany({
          where: { id: { in: validTableIds } },
          data: { status: 'OCCUPIED' },
        });
      }

      return order;
    });

    if (io) {
      io.emit('order-created', { orderId: newOrder.id });
      if (validTableIds.length > 0) {
        io.emit('tables-updated', {
          tableIds: validTableIds,
          status: 'OCCUPIED',
        });
      }
    }

    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order. Transaction rolled back.' });
  }
});


// 8. PUT /api/orders/:id/status - Update order status (promotes states and frees merged tables on PAID)
router.put('/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const existingOrder = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: { tables: true },
    });

    if (!existingOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: parseInt(id) },
        data: { status },
        include: { tables: true },
      });

      // If status is PAID, FREE up the tables if associated
      if (status === 'PAID' && order.tables.length > 0) {
        for (const t of order.tables) {
          const activeOrdersCount = await tx.order.count({
            where: {
              tables: { some: { id: t.id } },
              status: {
                in: ['TO_COOK', 'PREPARING', 'COMPLETED'],
              },
              id: { not: order.id }
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

      return order;
    });

    if (io) {
      io.emit('order-status-updated', { orderId: parseInt(id), status });
      if (status === 'PAID' && updatedOrder.tables.length > 0) {
        io.emit('tables-updated', {
          tableIds: updatedOrder.tables.map((t) => t.id),
          status: 'FREE',
        });
      }
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// 9. PUT /api/order-items/:id/status - Update specific food item preparation status (for kitchen module integration)
router.put('/order-items/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // PENDING, PREPARING, READY, SERVED

    const updatedItem = await prisma.orderItem.update({
      where: { id: parseInt(id) },
      data: {
        status,
        completed: status === 'READY' || status === 'SERVED',
      },
      include: {
        product: true,
      },
    });

    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating order item status:', error);
    res.status(500).json({ error: 'Failed to update item preparation status' });
  }
});

// 10. GET /api/waitlist - Returns active waitlist entries
router.get('/waitlist', async (req, res) => {
  try {
    const waiting = await prisma.waitlist.findMany({
      where: { status: 'WAITING' },
      orderBy: { createdAt: 'asc' },
    });
    res.json(waiting);
  } catch (error) {
    console.error('Error fetching waitlist:', error);
    res.status(500).json({ error: 'Failed to fetch waitlist queue' });
  }
});

// 11. POST /api/waitlist - Log a customer in queue
router.post('/waitlist', async (req, res) => {
  try {
    const { customerName, groupSize } = req.body;
    if (!customerName || !groupSize) {
      return res.status(400).json({ error: 'Customer name and group size are required' });
    }

    const wait = await prisma.waitlist.create({
      data: {
        customerName,
        groupSize: parseInt(groupSize),
        status: 'WAITING',
      },
    });

    res.status(201).json(wait);
  } catch (error) {
    console.error('Error adding to waitlist:', error);
    res.status(500).json({ error: 'Failed to add customer to waitlist queue' });
  }
});

// 12. POST /api/waitlist/:id/seat - Seat a waitlist customer (sets status to SEATED and occupies tables)
router.post('/waitlist/:id/seat', async (req, res) => {
  try {
    const { id } = req.params;
    const { tableIds } = req.body; // array of table IDs to assign

    if (!tableIds || tableIds.length === 0) {
      return res.status(400).json({ error: 'At least one table must be selected to seat customer' });
    }

    const validTableIds = tableIds.map((tid) => parseInt(tid));

    const seated = await prisma.$transaction(async (tx) => {
      // 1. Mark waitlist status as SEATED
      const waitEntry = await tx.waitlist.update({
        where: { id: parseInt(id) },
        data: { status: 'SEATED' },
      });

      // 2. Mark table statuses as OCCUPIED
      await tx.table.updateMany({
        where: { id: { in: validTableIds } },
        data: { status: 'OCCUPIED' },
      });

      return waitEntry;
    });

    res.json(seated);
  } catch (error) {
    console.error('Error seating waitlist customer:', error);
    res.status(500).json({ error: 'Failed to update waitlist seating' });
  }
});

export default router;
