const { Server } = require('socket.io');

/**
 * Initializes Socket.IO on the given HTTP server and returns the io instance.
 * Other modules in the hackathon project can connect to this same server
 * and listen for events emitted by the admin module, e.g.:
 *   product:created / product:updated / product:deleted
 *   category:created / category:updated / category:deleted
 *   coupon:created / coupon:deleted
 *   floor:created / floor:updated / floor:deleted
 *   table:created / table:updated / table:deleted
 */
function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`[socket] client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`[socket] client disconnected: ${socket.id}`);
    });
  });

  return io;
}

module.exports = initSocket;
