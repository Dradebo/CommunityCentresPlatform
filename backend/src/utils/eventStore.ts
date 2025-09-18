interface RealtimeEvent {
  id: string;
  type: 'new-message' | 'center-updated' | 'new-contact-message' | 'user-typing';
  data: any;
  timestamp: number;
  userId?: string;
}

class EventStore {
  private events: RealtimeEvent[] = [];
  private readonly MAX_EVENTS = 1000; // Keep last 1000 events in memory
  private readonly EVENT_TTL = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Add a new event to the store
   */
  addEvent(type: RealtimeEvent['type'], data: any, userId?: string): RealtimeEvent {
    const event: RealtimeEvent = {
      id: this.generateEventId(),
      type,
      data,
      timestamp: Date.now(),
      userId
    };

    this.events.push(event);

    // Clean up old events
    this.cleanup();

    console.log(`📨 Event stored: ${type} (${event.id})`);
    return event;
  }

  /**
   * Get events since a specific event ID or timestamp
   */
  getEventsSince(sinceId: string): RealtimeEvent[] {
    const sinceTimestamp = parseInt(sinceId) || 0;

    return this.events.filter(event =>
      event.timestamp > sinceTimestamp
    ).sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Get events for a specific user
   */
  getEventsForUser(userId: string, sinceId: string = '0'): RealtimeEvent[] {
    const sinceTimestamp = parseInt(sinceId) || 0;

    return this.events.filter(event =>
      event.timestamp > sinceTimestamp &&
      (event.userId === userId || !event.userId) // Include global events
    ).sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Get all events (for debugging)
   */
  getAllEvents(): RealtimeEvent[] {
    return [...this.events].sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Clean up old events
   */
  private cleanup() {
    const now = Date.now();

    // Remove events older than TTL
    this.events = this.events.filter(event =>
      now - event.timestamp < this.EVENT_TTL
    );

    // Keep only the latest MAX_EVENTS
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }
  }

  /**
   * Generate a unique event ID
   */
  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get store statistics
   */
  getStats() {
    return {
      totalEvents: this.events.length,
      oldestEvent: this.events.length > 0 ? new Date(this.events[0].timestamp) : null,
      newestEvent: this.events.length > 0 ? new Date(this.events[this.events.length - 1].timestamp) : null,
      eventTypes: this.events.reduce((acc, event) => {
        acc[event.type] = (acc[event.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  /**
   * Clear all events (for testing)
   */
  clear() {
    this.events = [];
  }
}

// Export singleton instance
export const eventStore = new EventStore();

// Helper function to emit events
export const emitRealtimeEvent = (
  type: RealtimeEvent['type'],
  data: any,
  userId?: string
): RealtimeEvent => {
  return eventStore.addEvent(type, data, userId);
};