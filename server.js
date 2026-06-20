import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import router from './routes.js';
import { initSocket } from './src/socket/socket.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Log requests for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api', router);

// Admin Module Routes (integrated locally)
import authRoutes from './admin-module/backend/routes/authRoutes.js';
import productRoutes from './admin-module/backend/routes/productRoutes.js';
import categoryRoutes from './admin-module/backend/routes/categoryRoutes.js';
import couponRoutes from './admin-module/backend/routes/couponRoutes.js';
import floorRoutes from './admin-module/backend/routes/floorRoutes.js';
import tableRoutes from './admin-module/backend/routes/tableRoutes.js';

app.use('/auth', authRoutes);
app.use('/products', productRoutes);
app.use('/categories', categoryRoutes);
app.use('/coupons', couponRoutes);
app.use('/floors', floorRoutes);
app.use('/tables', tableRoutes);

const server = createServer(app);
const io = initSocket(server);
app.set('io', io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

server.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
