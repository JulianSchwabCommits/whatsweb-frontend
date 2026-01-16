import { io, Socket } from 'socket.io-client';
import { BACKEND_URL } from './env';
import { toast } from 'sonner';

class ChatService {
  private socket: Socket | null = null;
  
  // Connect when user logs in
  connect(token: string) {
    // Disconnect any existing connection first
    if (this.socket?.connected) {
      this.socket.disconnect();
    }
    
    this.socket = io(BACKEND_URL, {
      auth: { token },
      transports: ['websocket'],
      // Disable auto-reconnect on logout
      autoConnect: true,
      // Add reconnection settings
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });
    
    this.socket.on('authenticated', (data) => {
      console.log('Connected:', data.userId);
    });
    
    this.socket.on('error', (error) => {
      this.handleError(error);
    });
    
    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      toast.error('Connection Error', {
        description: error.message || 'Failed to connect to server'
      });
    });
  }
  
  // Explicit disconnect - call on logout
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
  
  // Check if connected
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
  
  // Get socket instance for use in hooks/components
  getSocket(): Socket | null {
    return this.socket;
  }
  
  private handleError(error: any) {
    const errorMsg = typeof error === 'string' ? error : error.message || 'Unknown error';
    const errorCode = typeof error === 'object' ? error.code : null;
    
    console.error('Socket error:', error);
    
    // Display appropriate toast based on error code
    if (errorCode) {
      switch (errorCode) {
        case 'AUTHENTICATION_FAILED':
          toast.error('Authentication Failed', {
            description: errorMsg
          });
          break;
        case 'RATE_LIMIT':
          toast.warning('Rate Limit', {
            description: errorMsg
          });
          break;
        case 'INVALID_ROOM':
          toast.error('Invalid Room', {
            description: errorMsg
          });
          break;
        default:
          toast.error('Error', {
            description: errorMsg
          });
      }
    } else {
      toast.error('Error', {
        description: errorMsg
      });
    }
  }
}

// Singleton instance
export const chatService = new ChatService();
