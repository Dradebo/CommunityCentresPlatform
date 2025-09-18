import { useEffect, useState } from 'react';
import { apiService } from './api';

export interface RealtimeEvent {
  type: 'new-message' | 'center-updated' | 'new-contact-message' | 'user-typing';
  data: any;
  timestamp: number;
  userId?: string;
  id: string;
}

interface RealtimeSubscription {
  id: string;
  callback: (event: RealtimeEvent) => void;
  filter?: (event: RealtimeEvent) => boolean;
}

class RealtimeService {
  private subscriptions: Map<string, RealtimeSubscription> = new Map();
  private pollingInterval: NodeJS.Timeout | null = null;
  private sseSource: EventSource | null = null;
  private lastEventId: string = '0';
  private isPolling = false;
  private strategy: 'sse' | 'polling' = 'polling';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor() {
    this.detectBestStrategy();
  }

  private detectBestStrategy() {
    // Try SSE first, fallback to polling if it fails
    if (typeof EventSource !== 'undefined' && !navigator.userAgent.includes('Edge')) {
      this.strategy = 'sse';
    } else {
      this.strategy = 'polling';
    }
    console.log(`🔄 Real-time strategy: ${this.strategy}`);
  }

  /**
   * Subscribe to real-time events
   */
  subscribe(callback: (event: RealtimeEvent) => void, filter?: (event: RealtimeEvent) => boolean): string {
    const id = Math.random().toString(36).substr(2, 9);
    this.subscriptions.set(id, { id, callback, filter });

    // Start real-time updates if this is the first subscription
    if (this.subscriptions.size === 1) {
      this.startRealtimeUpdates();
    }

    return id;
  }

  /**
   * Unsubscribe from real-time events
   */
  unsubscribe(subscriptionId: string) {
    this.subscriptions.delete(subscriptionId);

    // Stop updates if no more subscriptions
    if (this.subscriptions.size === 0) {
      this.stopRealtimeUpdates();
    }
  }

  /**
   * Start real-time updates based on chosen strategy
   */
  private startRealtimeUpdates() {
    if (this.strategy === 'sse') {
      this.startSSE();
    } else {
      this.startPolling();
    }
  }

  /**
   * Server-Sent Events implementation
   */
  private startSSE() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No auth token found, falling back to polling');
        this.fallbackToPolling();
        return;
      }

      const apiUrl = import.meta.env.VITE_API_URL || '/api';
      const url = `${apiUrl}/events?lastEventId=${this.lastEventId}`;

      this.sseSource = new EventSource(url);

      this.sseSource.onopen = () => {
        console.log('✅ SSE connection established');
        this.reconnectAttempts = 0;
      };

      this.sseSource.onmessage = (event) => {
        try {
          const realtimeEvent: RealtimeEvent = JSON.parse(event.data);
          this.lastEventId = event.lastEventId || realtimeEvent.id || String(Date.now());
          this.broadcastEvent(realtimeEvent);
        } catch (error) {
          console.error('❌ Error parsing SSE event:', error);
        }
      };

      this.sseSource.onerror = (error) => {
        console.warn('⚠️ SSE connection error:', error);
        this.handleSSEError();
      };

    } catch (error) {
      console.warn('❌ SSE not available, using polling:', error);
      this.fallbackToPolling();
    }
  }

  private handleSSEError() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`🔄 SSE reconnect attempt ${this.reconnectAttempts}`);
        this.startSSE();
      }, 1000 * this.reconnectAttempts); // Exponential backoff
    } else {
      console.warn('⚠️ Max SSE reconnection attempts reached, falling back to polling');
      this.fallbackToPolling();
    }
  }

  private fallbackToPolling() {
    this.sseSource?.close();
    this.strategy = 'polling';
    this.startPolling();
  }

  /**
   * Polling implementation - guaranteed to work everywhere
   */
  private startPolling() {
    if (this.isPolling) return;

    console.log('🔄 Starting polling mode');
    this.isPolling = true;

    // Initial fetch
    this.fetchLatestEvents();

    // Set up polling interval
    this.pollingInterval = setInterval(async () => {
      try {
        await this.fetchLatestEvents();
      } catch (error) {
        console.debug('Polling error:', error);
      }
    }, 3000); // Poll every 3 seconds
  }

  /**
   * Fetch latest events via polling
   */
  private async fetchLatestEvents() {
    try {
      const response = await apiService.get(`/events?since=${this.lastEventId}`);
      const events: RealtimeEvent[] = response.events || [];

      if (events.length > 0) {
        console.log(`📨 Received ${events.length} events via polling`);
      }

      events.forEach(event => {
        this.broadcastEvent(event);
        if (event.timestamp) {
          this.lastEventId = Math.max(parseInt(this.lastEventId), event.timestamp).toString();
        }
      });

    } catch (error) {
      // Silently fail for auth errors, log others
      if (error instanceof Error && !error.message.includes('401')) {
        console.debug('Polling fetch failed:', error);
      }
    }
  }

  /**
   * Broadcast event to all subscribers
   */
  private broadcastEvent(event: RealtimeEvent) {
    this.subscriptions.forEach(({ callback, filter }) => {
      if (!filter || filter(event)) {
        try {
          callback(event);
        } catch (error) {
          console.error('❌ Error in event callback:', error);
        }
      }
    });
  }

  /**
   * Stop all real-time updates
   */
  private stopRealtimeUpdates() {
    console.log('🛑 Stopping real-time updates');

    // Stop SSE
    if (this.sseSource) {
      this.sseSource.close();
      this.sseSource = null;
    }

    // Stop polling
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }

    this.isPolling = false;
  }

  /**
   * Emit an event (for local testing or immediate updates)
   */
  emit(type: RealtimeEvent['type'], data: any, userId?: string) {
    const event: RealtimeEvent = {
      type,
      data,
      timestamp: Date.now(),
      userId,
      id: Math.random().toString(36).substr(2, 9)
    };

    this.broadcastEvent(event);
  }

  /**
   * Get current connection status
   */
  getStatus() {
    return {
      strategy: this.strategy,
      connected: this.sseSource?.readyState === EventSource.OPEN || this.isPolling,
      subscribers: this.subscriptions.size,
      lastEventId: this.lastEventId
    };
  }

  /**
   * Force reconnection
   */
  reconnect() {
    this.stopRealtimeUpdates();
    this.reconnectAttempts = 0;
    if (this.subscriptions.size > 0) {
      this.startRealtimeUpdates();
    }
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService();

// React hooks for easy integration
export const useRealtimeSubscription = (
  callback: (event: RealtimeEvent) => void,
  filter?: (event: RealtimeEvent) => boolean,
  deps: any[] = []
) => {
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);

  useEffect(() => {
    const id = realtimeService.subscribe(callback, filter);
    setSubscriptionId(id);

    return () => {
      realtimeService.unsubscribe(id);
    };
  }, deps);

  return subscriptionId;
};

// Specialized hooks for different event types
export const useMessageSubscription = (callback: (message: any) => void) => {
  return useRealtimeSubscription(
    (event) => callback(event.data),
    (event) => event.type === 'new-message',
    [callback]
  );
};

export const useCenterUpdates = (callback: (center: any) => void) => {
  return useRealtimeSubscription(
    (event) => callback(event.data),
    (event) => event.type === 'center-updated',
    [callback]
  );
};

export const useContactMessageUpdates = (callback: (message: any) => void) => {
  return useRealtimeSubscription(
    (event) => callback(event.data),
    (event) => event.type === 'new-contact-message',
    [callback]
  );
};

export const useTypingIndicator = (callback: (data: { userId: string; isTyping: boolean }) => void) => {
  return useRealtimeSubscription(
    (event) => callback(event.data),
    (event) => event.type === 'user-typing',
    [callback]
  );
};

// Connection status hook
export const useRealtimeStatus = () => {
  const [status, setStatus] = useState(realtimeService.getStatus());

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(realtimeService.getStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return status;
};