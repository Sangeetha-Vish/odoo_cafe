import { Server } from 'socket.io';

export let io = null;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: "*" }
  });

  io.on('connection', (socket) => {
    console.log(`📡 Connected KDS node node ID: ${socket.id}`);

    // Listening for Member 2 (POS Placement event)
    socket.on('order-created', (payload) => {
      // Broadcast alerts directly down to our active KDS screen instances
      io.emit('order-created', payload);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Node disconnected: ${socket.id}`);
    });
  });

  return io;
};
