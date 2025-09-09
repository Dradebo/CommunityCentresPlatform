import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../utils/env';

class SocketService {
  private socket: Socket | null = null;
  private readonly url: string;

  constructor() {
    this.url = SOCKET_URL;
  }

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      this.socket = io(this.url, {
        auth: { token },
        transports: ['websocket', 'polling']
      });

      this.socket.on('connect', () => {
        console.log('Connected to server');
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Disconnected from server:', reason);
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Center room management
  joinCenter(centerId: string) {
    this.socket?.emit('join-center', centerId);
  }

  leaveCenter(centerId: string) {
    this.socket?.emit('leave-center', centerId);
  }

  // Thread room management
  joinThread(threadId: string) {
    this.socket?.emit('join-thread', threadId);
  }

  leaveThread(threadId: string) {
    this.socket?.emit('leave-thread', threadId);
  }

  // Typing indicators
  startTyping(threadId: string, userName: string) {
    this.socket?.emit('typing-start', { threadId, userName });
  }

  stopTyping(threadId: string, userName: string) {
    this.socket?.emit('typing-stop', { threadId, userName });
  }

  // Event listeners
  onNewMessage(callback: (message: any) => void) {
    this.socket?.on('new-message', callback);
  }

  onCenterUpdate(callback: (update: any) => void) {
    this.socket?.on('center-updated', callback);
  }

  onNewContactMessage(callback: (message: any) => void) {
    this.socket?.on('new-contact-message', callback);
  }

  onUserTyping(callback: (data: { userName: string; typing: boolean }) => void) {
    this.socket?.on('user-typing', callback);
  }

  // Remove event listeners
  offNewMessage() {
    this.socket?.off('new-message');
  }

  offCenterUpdate() {
    this.socket?.off('center-updated');
  }

  offNewContactMessage() {
    this.socket?.off('new-contact-message');
  }

  offUserTyping() {
    this.socket?.off('user-typing');
  }

  // Check connection status
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();