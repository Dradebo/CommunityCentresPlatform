import express from 'express';
import cors from 'cors';

const app = express();

// Basic CORS
app.use(cors({
  origin: ['https://kii-impact.org', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());

// Simple health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: process.env.DATABASE_URL ? 'connected' : 'not configured'
  });
});

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

export default app;