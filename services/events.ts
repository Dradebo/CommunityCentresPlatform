import { API_BASE_URL } from '../utils/env';
import { apiService } from './api';

type Callback<T = any> = (payload: T) => void;

class SSEService {
  private es: EventSource | null = null;
  private readonly url: string;
  private subscribers: Map<string, Set<Callback>> = new Map();
  private joinedCenters: Set<string> = new Set();
  private joinedThreads: Set<string> = new Set();

  constructor() {
    this.url = `${API_BASE_URL}/events`;
  }

  private getToken(): string | null {
    try { return localStorage.getItem('auth_token'); } catch { return null; }
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.es) return resolve();

      const token = this.getToken();
      const url = token ? `${this.url}?token=${encodeURIComponent(token)}` : this.url;

      this.es = new EventSource(url, { withCredentials: false });

      const onOpen = async () => {
        this.es?.removeEventListener('error', onError as EventListener);
        // resubscribe to prior rooms
        for (const id of this.joinedCenters) { await this.joinCenter(id); }
        for (const id of this.joinedThreads) { await this.joinThread(id); }
        resolve();
      };
      const onError = (e: Event) => { this.cleanup(); reject(e); };

      this.es.addEventListener('open', onOpen as EventListener);
      this.es.addEventListener('error', onError as EventListener);

      // Wire named events
      this.es.addEventListener('new-message', (ev: MessageEvent) => this.dispatch('new-message', parseData(ev.data)));
      this.es.addEventListener('center-updated', (ev: MessageEvent) => this.dispatch('center-updated', parseData(ev.data)));
      this.es.addEventListener('user-typing', (ev: MessageEvent) => this.dispatch('user-typing', parseData(ev.data)));
    });
  }

  disconnect() { this.cleanup(); }

  private cleanup() {
    if (this.es) {
      try { this.es.close(); } catch {}
      this.es = null;
    }
  }

  // Subscriptions (client -> server via REST, server -> client via SSE)
  async joinCenter(centerId: string) { await apiService.post('/realtime/join-center', { centerId }); }
  async leaveCenter(centerId: string) { await apiService.post('/realtime/leave-center', { centerId }); }
  async joinThread(threadId: string) { await apiService.post('/realtime/join-thread', { threadId }); }
  async leaveThread(threadId: string) { await apiService.post('/realtime/leave-thread', { threadId }); }
  // track joined sets for resubscribe
  async joinCenterTracked(centerId: string) { await this.joinCenter(centerId); this.joinedCenters.add(centerId); }
  async leaveCenterTracked(centerId: string) { await this.leaveCenter(centerId); this.joinedCenters.delete(centerId); }
  async joinThreadTracked(threadId: string) { await this.joinThread(threadId); this.joinedThreads.add(threadId); }
  async leaveThreadTracked(threadId: string) { await this.leaveThread(threadId); this.joinedThreads.delete(threadId); }

  async startTyping(threadId: string, userName: string) { await apiService.post('/realtime/typing-start', { threadId, userName }); }
  async stopTyping(threadId: string, userName: string) { await apiService.post('/realtime/typing-stop', { threadId, userName }); }

  // Event listeners API (mirrors previous socket service)
  onNewMessage(cb: Callback) { this.on('new-message', cb); }
  onCenterUpdate(cb: Callback) { this.on('center-updated', cb); }
  onUserTyping(cb: Callback<{ userName: string; typing: boolean }>) { this.on('user-typing', cb as Callback); }

  offNewMessage() { this.off('new-message'); }
  offCenterUpdate() { this.off('center-updated'); }
  offUserTyping() { this.off('user-typing'); }

  isConnected(): boolean { return !!this.es; }

  private on(type: string, cb: Callback) {
    if (!this.subscribers.has(type)) this.subscribers.set(type, new Set());
    this.subscribers.get(type)!.add(cb);
  }

  private off(type: string) { this.subscribers.delete(type); }

  private dispatch(type: string, payload: any) {
    const set = this.subscribers.get(type); if (!set) return;
    set.forEach(cb => cb(payload));
  }
}

function parseData(data: any) {
  try { return JSON.parse(data); } catch { return data; }
}

export const eventsService = new SSEService();


