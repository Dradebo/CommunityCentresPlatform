import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types';

interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
}

export const initializeSocket = (httpServer: HTTPServer): SocketIOServer => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  // Authentication middleware for socket connections
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
      socket.user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        name: decoded.name
      };
      next();
    } catch (error) {
      next(new Error('Invalid authentication token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User ${socket.user?.name} connected with socket ID: ${socket.id}`);

    // Join center-specific rooms for real-time updates
    socket.on('join-center', (centerId: string) => {
      socket.join(`center-${centerId}`);
      console.log(`User ${socket.user?.name} joined center room: center-${centerId}`);
    });

    socket.on('leave-center', (centerId: string) => {
      socket.leave(`center-${centerId}`);
      console.log(`User ${socket.user?.name} left center room: center-${centerId}`);
    });

    // Join message thread rooms
    socket.on('join-thread', (threadId: string) => {
      socket.join(`thread-${threadId}`);
      console.log(`User ${socket.user?.name} joined thread room: thread-${threadId}`);
    });

    socket.on('leave-thread', (threadId: string) => {
      socket.leave(`thread-${threadId}`);
      console.log(`User ${socket.user?.name} left thread room: thread-${threadId}`);
    });

    // Handle typing indicators
    socket.on('typing-start', (data: { threadId: string; userName: string }) => {
      socket.to(`thread-${data.threadId}`).emit('user-typing', {
        userName: data.userName,
        typing: true
      });
    });

    socket.on('typing-stop', (data: { threadId: string; userName: string }) => {
      socket.to(`thread-${data.threadId}`).emit('user-typing', {
        userName: data.userName,
        typing: false
      });
    });

    socket.on('disconnect', () => {
      console.log(`User ${socket.user?.name} disconnected`);
    });
  });

  return io;
};

// Utility functions to emit events from API routes
export const emitNewMessage = (io: SocketIOServer, threadId: string, message: any) => {
  io.to(`thread-${threadId}`).emit('new-message', message);
};

export const emitCenterUpdate = (io: SocketIOServer, centerId: string, update: any) => {
  io.to(`center-${centerId}`).emit('center-updated', update);
};

export const emitNewContactMessage = (io: SocketIOServer, message: any) => {
  io.emit('new-contact-message', message);
};