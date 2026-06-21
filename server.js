import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import router from './routes.js';
import { initSocket } from './src/socket/socket.js';
import { createCorsOptions } from './shared/auth/backend/corsConfig.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002;

app.use(cors(createCorsOptions()));
app.use(express.json());

// Log requests for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api', router);

const server = createServer(app);
initSocket(server);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

server.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
