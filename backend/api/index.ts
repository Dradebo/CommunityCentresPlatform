import { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Import your routes
import authRoutes from '../src/routes/auth';
import centerRoutes from '../src/routes/centers';
import messageRoutes from '../src/routes/messages';
import eventRoutes from '../src/routes/events';

// Load environment variables
dotenv.config({ path: '../.env' });

const app = express();

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false
}));

// CORS configuration for Vercel
app.use(cors({
  origin: process.env.FRONTEND_URL || true,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/centers', centerRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/events', eventRoutes);

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Export for Vercel
export default app;