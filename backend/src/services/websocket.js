import jwt from 'jsonwebtoken';
import User from '../models/User.js';

class WebSocketService {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map(); // userId -> socket
    this.userSockets = new Map(); // socketId -> userId
    
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  setupMiddleware() {
    // Authentication middleware for WebSocket connections
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
          return next(new Error('User not found'));
        }

        socket.user = user;
        next();
      } catch (error) {
        next(new Error('Invalid authentication token'));
      }
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 User ${socket.user.username} connected via WebSocket`);
      
      // Store user connection
      this.connectedUsers.set(socket.user._id.toString(), socket);
      this.userSockets.set(socket.id, socket.user._id.toString());
      
      // Join user-specific room
      socket.join(`user_${socket.user._id}`);
      
      // Join role-based rooms
      socket.join(`role_${socket.user.role}`);
      
      // Join country-based room if user is verifier or admin
      if (socket.user.role === 'verifier' || socket.user.role === 'admin') {
        socket.join(`country_${socket.user.country}`);
      }

      // Send connection confirmation
      socket.emit('connected', {
        message: 'Connected to real-time updates',
        userId: socket.user._id,
        role: socket.user.role,
        country: socket.user.country
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`🔌 User ${socket.user.username} disconnected`);
        this.connectedUsers.delete(socket.user._id.toString());
        this.userSockets.delete(socket.id);
      });

      // Handle explicit disconnect
      socket.on('disconnect_user', () => {
        socket.disconnect();
      });

      // Handle ping/pong for connection health
      socket.on('ping', () => {
        socket.emit('pong');
      });
    });
  }

  // Emit to specific user
  emitToUser(userId, event, data) {
    this.io.to(`user_${userId}`).emit(event, data);
  }

  // Emit to all users in a role
  emitToRole(role, event, data) {
    this.io.to(`role_${role}`).emit(event, data);
  }

  // Emit to all users in a country
  emitToCountry(country, event, data) {
    this.io.to(`country_${country}`).emit(event, data);
  }

  // Emit to all connected users
  emitToAll(event, data) {
    this.io.emit(event, data);
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  // Check if user is online
  isUserOnline(userId) {
    return this.connectedUsers.has(userId.toString());
  }

  // Broadcast submission events
  broadcastSubmissionCreated(submission) {
    const submissionData = {
      id: submission._id,
      title: submission.title,
      publisher: submission.publisher,
      country: submission.country,
      category: submission.category,
      submitter: {
        id: submission.submitter._id,
        username: submission.submitter.username,
        country: submission.submitter.country
      },
      createdAt: submission.createdAt,
      message: `📝 New submission: "${submission.title}" from ${submission.publisher}`
    };

    // Notify all verifiers and admins
    this.emitToRole('verifier', 'submission:created', submissionData);
    this.emitToRole('admin', 'submission:created', submissionData);
    
    // Notify country-specific verifiers
    this.emitToCountry(submission.country, 'submission:created', submissionData);
  }

  broadcastSubmissionVerified(submission, verifier) {
    const submissionData = {
      id: submission._id,
      title: submission.title,
      publisher: submission.publisher,
      country: submission.country,
      category: submission.category,
      status: submission.status,
      credibility: submission.credibility,
      verifierNotes: submission.verifierNotes,
      verifier: {
        id: verifier._id,
        username: verifier.username,
        country: verifier.country
      },
      verifiedAt: submission.verifiedAt,
      message: submission.status === 'approved' 
        ? `✅ Submission verified: "${submission.title}" marked as ${submission.credibility}`
        : `❌ Submission rejected: "${submission.title}"`
    };

    // Notify the submitter
    this.emitToUser(submission.submitter._id, 'submission:verified', submissionData);
    
    // Notify admins
    this.emitToRole('admin', 'submission:verified', submissionData);
    
    // Notify country verifiers about the action
    this.emitToCountry(submission.country, 'submission:verified', submissionData);
  }

  broadcastSubmissionUpdated(submission, updatedBy) {
    const submissionData = {
      id: submission._id,
      title: submission.title,
      publisher: submission.publisher,
      country: submission.country,
      category: submission.category,
      status: submission.status,
      updatedBy: {
        id: updatedBy._id,
        username: updatedBy.username
      },
      updatedAt: submission.updatedAt,
      message: `📝 Submission updated: "${submission.title}" by ${updatedBy.username}`
    };

    // Notify admins about updates
    this.emitToRole('admin', 'submission:updated', submissionData);
    
    // Notify country verifiers
    this.emitToCountry(submission.country, 'submission:updated', submissionData);
  }

  broadcastSubmissionDeleted(submission, deletedBy) {
    const submissionData = {
      id: submission._id,
      title: submission.title,
      publisher: submission.publisher,
      country: submission.country,
      deletedBy: {
        id: deletedBy._id,
        username: deletedBy.username
      },
      message: `🗑️ Submission deleted: "${submission.title}" by ${deletedBy.username}`
    };

    // Notify admins
    this.emitToRole('admin', 'submission:deleted', submissionData);
    
    // Notify country verifiers
    this.emitToCountry(submission.country, 'submission:deleted', submissionData);
  }

  // System-wide notifications
  broadcastSystemNotification(message, type = 'info') {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toISOString()
    };

    this.emitToAll('system:notification', notification);
  }

  // Get statistics for admins
  getConnectionStats() {
    const stats = {
      totalConnections: this.getConnectedUsersCount(),
      usersByRole: {},
      usersByCountry: {}
    };

    // Count users by role and country
    for (const [userId, socket] of this.connectedUsers) {
      const user = socket.user;
      
      // Count by role
      stats.usersByRole[user.role] = (stats.usersByRole[user.role] || 0) + 1;
      
      // Count by country (for verifiers and admins)
      if (user.role === 'verifier' || user.role === 'admin') {
        stats.usersByCountry[user.country] = (stats.usersByCountry[user.country] || 0) + 1;
      }
    }

    return stats;
  }
}

export default WebSocketService;
