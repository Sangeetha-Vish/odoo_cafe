require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const http = require('http');

const initSocket = require('./socket');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const couponRoutes = require('./routes/couponRoutes');
const floorRoutes = require('./routes/floorRoutes');
const tableRoutes = require('./routes/tableRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();
const server = http.createServer(app);

// ---- Socket.IO ----
const io = initSocket(server);
app.set('io', io); // controllers access it via req.app.get('io')

// ---- Core middleware ----
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());
app.use(morgan('dev'));

// ---- Health check ----
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Admin module API is up' });
});

// ---- Routes ----
app.use('/auth', authRoutes);
app.use('/products', productRoutes);
app.use('/categories', categoryRoutes);
app.use('/coupons', couponRoutes);
app.use('/floors', floorRoutes);
app.use('/tables', tableRoutes);
app.use('/orders', orderRoutes);

// ---- 404 + error handling ----
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`[server] Admin module API listening on port ${PORT}`);
});
