import socketAuth from '../middleware/socketAuth.js';
import { initializeSocketIO } from '../services/socketService.js';

/**
 * Setup Socket.io with authentication and event handlers
 */
const setupSocketIO = (io) => {
  // Initialize the socket service with the io instance
  initializeSocketIO(io);

  // Apply authentication middleware to all connections
  io.use(socketAuth);

  // Handle client connections
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId} (${socket.userRole})`);

    // Join room based on user role and country
    if (socket.userRole === 'admin') {
      // Admins can see all submissions
      socket.join('admin');
      socket.join('all-submissions');
    } else if (socket.userRole === 'verifier') {
      // Verifiers join their country's room
      socket.join(`country:${socket.userCountry}`);
      socket.join('verifiers');
    }

    // Join user's personal room for notifications
    socket.join(`user:${socket.userId}`);

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  return io;
};

export default setupSocketIO;

