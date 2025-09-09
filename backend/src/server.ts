console.log('📦 Loading dependencies...');

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import dotenv from 'dotenv';

console.log('✅ Core dependencies loaded');

// Import routes
console.log('📍 Loading route modules...');
try {
  console.log('  Importing auth routes...');
  var authRoutes = require('./routes/auth').default;
  console.log('  Importing centers routes...');
  var centersRoutes = require('./routes/centers').default;
  console.log('  Importing messages routes...');
  var messagesRoutes = require('./routes/messages').default;
  console.log('✅ Route modules loaded');
} catch (error) {
  console.error('❌ Failed to import route modules:', error);
  throw error;
}

// Import socket utilities
console.log('🔌 Loading socket utilities...');
import { initializeSocket } from './utils/socket';
console.log('✅ Socket utilities loaded');

console.log('🔄 Starting Kampala Community Centers API...');

// Load environment variables
dotenv.config();
console.log('✅ Environment variables loaded');

// Log environment status (without exposing secrets)
console.log('🔍 Environment check:');
console.log('  NODE_ENV:', process.env.NODE_ENV || 'undefined');
console.log('  PORT:', process.env.PORT || 'undefined');
console.log('  DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'MISSING');
console.log('  JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'MISSING');
console.log('  FRONTEND_URL:', process.env.FRONTEND_URL || 'undefined');

// Validate required environment variables - but don't exit, just warn
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.warn('⚠️ Missing required environment variables:', missingEnvVars.join(', '));
  console.warn('Server may not function correctly without these variables');
}

console.log('🔧 Creating Express app...');
const app = express();
const httpServer = createServer(app);
console.log('✅ Express app created');

// Initialize Socket.IO
console.log('🔌 Initializing Socket.IO...');
try {
  const io = initializeSocket(httpServer);
  // Make io available throughout the app
  app.set('socketio', io);
  console.log('✅ Socket.IO initialized');
} catch (error) {
  console.error('❌ Failed to initialize Socket.IO:', error);
  throw error;
}

// Security middleware
console.log('🛡️ Setting up security middleware...');
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
console.log('🌐 Setting up CORS...');
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
console.log('⚡ Setting up rate limiting...');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Body parsing middleware
console.log('📝 Setting up body parsing...');
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
console.log('✅ Middleware setup complete');

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Kampala Community Centers API',
    environment: process.env.NODE_ENV || 'development',
    port: PORT
  });
});

// API routes - wrapped in try-catch to handle import errors
console.log('🛣️ Loading API routes...');
try {
  console.log('  Loading auth routes...');
  app.use('/api/auth', authRoutes);
  console.log('  Loading centers routes...');
  app.use('/api/centers', centersRoutes);
  console.log('  Loading messages routes...');
  app.use('/api/messages', messagesRoutes);
  console.log('✅ All routes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load routes:', error);
  console.error('Stack trace:', error);
  throw error;
}

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.message
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or missing authentication token'
    });
  }

  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

console.log('🚢 Preparing to start server...');
const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

console.log(`🔍 Server will bind to ${HOST}:${PORT}`);

console.log('🎯 Attempting to start HTTP server...');
httpServer.listen(PORT, HOST, () => {
  console.log(`🚀 ✅ SERVER STARTED SUCCESSFULLY!`);
  console.log(`🚀 Server running on ${HOST}:${PORT}`);
  console.log(`📊 Health check: http://${HOST}:${PORT}/api/health`);
  console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`🔐 JWT secret configured: ${process.env.JWT_SECRET ? '✅' : '❌'}`);
  console.log(`💾 Database URL configured: ${process.env.DATABASE_URL ? '✅' : '❌'}`);
  console.log('🎉 Server initialization complete - ready to accept connections!');
});

// Handle server startup errors
httpServer.on('error', (error) => {
  console.error('❌ Server failed to start:', error);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default app;