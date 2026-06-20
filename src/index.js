import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import kitchenRoutes from './routes/kitchen.routes.js';
import { initSocket } from './socket/socket.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Main App Routes Allocation
app.use('/api', kitchenRoutes);

const server = createServer(app);

// Initialize Socket Context System
initSocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Kitchen Display isolated environment running on port ${PORT}`);
});
