import express from 'express';
import { auth } from '../middleware/auth';
import { eventStore } from '../utils/eventStore';

const router = express.Router();

/**
 * GET /api/events - Server-Sent Events endpoint + Polling fallback
 */
router.get('/', auth, (req, res) => {
  const { since = '0', mode = 'auto' } = req.query;
  const userId = req.user?.id;

  // Check if client accepts Server-Sent Events
  const acceptsSSE = req.headers.accept?.includes('text/event-stream');
  const userAgent = req.headers['user-agent'] || '';
  const isSSECapable = acceptsSSE && !userAgent.includes('Edge');

  if (mode === 'sse' || (mode === 'auto' && isSSECapable)) {
    // Server-Sent Events mode
    handleSSE(req, res, userId, since as string);
  } else {
    // Polling mode - return JSON
    handlePolling(req, res, userId, since as string);
  }
});

/**
 * Handle Server-Sent Events
 */
function handleSSE(req: express.Request, res: express.Response, userId: string, since: string) {
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
    'Access-Control-Allow-Credentials': 'true'
  });

  console.log(`🔌 SSE connection established for user ${userId}`);

  // Send initial events
  const initialEvents = eventStore.getEventsForUser(userId, since);
  initialEvents.forEach(event => {
    sendSSEEvent(res, event);
  });

  // Send keepalive ping every 30 seconds
  const pingInterval = setInterval(() => {
    res.write(': ping\n\n');
  }, 30000);

  // Handle client disconnect
  req.on('close', () => {
    console.log(`🔌 SSE connection closed for user ${userId}`);
    clearInterval(pingInterval);
    res.end();
  });

  // Keep connection alive - in real implementation, you'd listen for new events
  // For now, we'll close after 5 minutes to prevent resource leaks
  setTimeout(() => {
    clearInterval(pingInterval);
    res.end();
  }, 5 * 60 * 1000);
}

/**
 * Handle polling requests
 */
function handlePolling(req: express.Request, res: express.Response, userId: string, since: string) {
  try {
    const events = eventStore.getEventsForUser(userId, since);

    res.json({
      events,
      timestamp: Date.now(),
      count: events.length
    });
  } catch (error) {
    console.error('Polling error:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
}

/**
 * Send an event via SSE
 */
function sendSSEEvent(res: express.Response, event: any) {
  res.write(`id: ${event.id}\n`);
  res.write(`event: ${event.type}\n`);
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

/**
 * POST /api/events/test - Test endpoint to emit events (development only)
 */
if (process.env.NODE_ENV === 'development') {
  router.post('/test', auth, (req, res) => {
    const { type, data } = req.body;
    const userId = req.user?.id;

    const event = eventStore.addEvent(type, data, userId);

    res.json({
      success: true,
      event
    });
  });
}

/**
 * GET /api/events/stats - Get event store statistics
 */
router.get('/stats', auth, (req, res) => {
  const stats = eventStore.getStats();
  res.json(stats);
});

export default router;