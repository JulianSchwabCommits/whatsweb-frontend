import { io, Socket } from 'socket.io-client';
import { BACKEND_URL } from './env';
import { toast } from 'sonner';

class ChatService {
  private socket: Socket | null = null;

  connect(token: string) {
    this.disconnect();

    this.socket = io(BACKEND_URL, {
      auth: { token },
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('authenticated', ({ userId }) => {
      console.log('Socket authenticated:', userId);
    });

    this.socket.on('error', this.handleError);
    this.socket.on('connect_error', this.handleConnectError);
  }

  disconnect() {
    if (!this.socket) return;
    this.socket.disconnect();
    this.socket = null;
  }

  isConnected(): boolean {
    return !!this.socket?.connected;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  // error handling
  private handleConnectError = (error: any) => {
    console.error('Socket connection error:', error);

    toast.error('Connection Error', {
      description: error?.message || 'Failed to connect to server',
    });
  };

  private handleError = (error: any) => {
    console.error('Socket error:', error);

    const message =
      typeof error === 'string'
        ? error
        : error?.message || 'Unknown error';

    switch (error?.code) {
      case 'AUTHENTICATION_FAILED':
        toast.error('Authentication Failed', { description: message });
        break;
      case 'RATE_LIMIT':
        toast.warning('Rate Limit', { description: message });
        break;
      case 'INVALID_ROOM':
        toast.error('Invalid Room', { description: message });
        break;
      default:
        toast.error('Error', { description: message });
    }
  };
}

// Singleton
export const chatService = new ChatService();
