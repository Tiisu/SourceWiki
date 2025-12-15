import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

interface WebSocketEvent {
  type: string;
  data: any;
  timestamp: string;
}

interface UseWebSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  connectionError: string | null;
  emit: (event: string, data: any) => void;
  on: (event: string, callback: (data: any) => void) => () => void;
  off: (event: string, callback?: (data: any) => void) => void;
  disconnect: () => void;
  notifications: WebSocketEvent[];
  clearNotifications: () => void;
}


const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export const useWebSocket = (): UseWebSocketReturn => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<WebSocketEvent[]>([]);
  const eventListenersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());

  const getAuthToken = useCallback(() => {
    return localStorage.getItem('accessToken');
  }, []);


  const connect = useCallback(() => {
    const token = getAuthToken();
    if (!token) {
      console.log('🔌 No auth token available for WebSocket connection');
      return undefined; // Add return statement
    }

    console.log('🔌 Attempting WebSocket connection...');
    
    try {
      // Extract base URL from API_URL
      const baseURL = API_URL.replace('/api', '');
      
      socketRef.current = io(baseURL, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true,
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000
      });

      const socket = socketRef.current;

      // Connection event handlers
      socket.on('connect', () => {
        console.log('🔌 WebSocket connected successfully');
        setIsConnected(true);
        setConnectionError(null);
        
        // Show connection success toast
        toast.success('🔌 Connected to real-time updates', {
          duration: 2000,
          position: 'bottom-right'
        });
      });

      socket.on('connected', (data) => {
        console.log('🔌 WebSocket connection confirmed:', data);
        setIsConnected(true);
        setConnectionError(null);
      });

      socket.on('disconnect', (reason) => {
        console.log('🔌 WebSocket disconnected:', reason);
        setIsConnected(false);
        
        if (reason === 'io server disconnect') {
          // Server disconnected the client, need to reconnect manually
          setConnectionError('Server disconnected the connection');
        }
      });

      socket.on('connect_error', (error) => {
        console.error('🔌 WebSocket connection error:', error);
        setConnectionError(error.message);
        setIsConnected(false);
        
        // Show connection error toast
        toast.error('🔌 Connection failed: ' + error.message, {
          duration: 4000,
          position: 'bottom-right'
        });
      });

      socket.on('reconnect', (attemptNumber) => {
        console.log(`🔌 WebSocket reconnected after ${attemptNumber} attempts`);
        setIsConnected(true);
        setConnectionError(null);
        
        toast.success('🔌 Reconnected to real-time updates', {
          duration: 2000,
          position: 'bottom-right'
        });
      });

      socket.on('reconnect_error', (error) => {
        console.error('🔌 WebSocket reconnection error:', error);
        setConnectionError(error.message);
      });

      socket.on('reconnect_failed', () => {
        console.error('🔌 WebSocket reconnection failed');
        setConnectionError('Failed to reconnect to server');
        toast.error('🔌 Failed to reconnect. Please refresh the page.', {
          duration: 5000,
          position: 'bottom-right'
        });
      });

      // Submission event handlers
      socket.on('submission:created', (data) => {
        console.log('📝 New submission received:', data);
        
        const notification: WebSocketEvent = {
          type: 'submission:created',
          data,
          timestamp: new Date().toISOString()
        };
        
        setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep last 50 notifications
        
        // Show toast notification
        toast.success(data.message, {
          duration: 5000,
          position: 'bottom-right'
        });

        // Trigger event listeners
        const listeners = eventListenersRef.current.get('submission:created');
        if (listeners) {
          listeners.forEach(callback => callback(data));
        }
      });

      socket.on('submission:verified', (data) => {
        console.log('✅ Submission verification received:', data);
        
        const notification: WebSocketEvent = {
          type: 'submission:verified',
          data,
          timestamp: new Date().toISOString()
        };
        
        setNotifications(prev => [notification, ...prev.slice(0, 49)]);
        
        // Show toast notification
        toast.success(data.message, {
          duration: 5000,
          position: 'bottom-right'
        });

        // Trigger event listeners
        const listeners = eventListenersRef.current.get('submission:verified');
        if (listeners) {
          listeners.forEach(callback => callback(data));
        }
      });

      socket.on('submission:updated', (data) => {
        console.log('📝 Submission update received:', data);
        
        const notification: WebSocketEvent = {
          type: 'submission:updated',
          data,
          timestamp: new Date().toISOString()
        };
        
        setNotifications(prev => [notification, ...prev.slice(0, 49)]);
        
        // Show info toast
        toast.info(data.message, {
          duration: 4000,
          position: 'bottom-right'
        });

        // Trigger event listeners
        const listeners = eventListenersRef.current.get('submission:updated');
        if (listeners) {
          listeners.forEach(callback => callback(data));
        }
      });

      socket.on('submission:deleted', (data) => {
        console.log('🗑️ Submission deletion received:', data);
        
        const notification: WebSocketEvent = {
          type: 'submission:deleted',
          data,
          timestamp: new Date().toISOString()
        };
        
        setNotifications(prev => [notification, ...prev.slice(0, 49)]);
        
        // Show warning toast
        toast.warning(data.message, {
          duration: 4000,
          position: 'bottom-right'
        });

        // Trigger event listeners
        const listeners = eventListenersRef.current.get('submission:deleted');
        if (listeners) {
          listeners.forEach(callback => callback(data));
        }
      });

      socket.on('system:notification', (data) => {
        console.log('📢 System notification received:', data);
        
        const notification: WebSocketEvent = {
          type: 'system:notification',
          data,
          timestamp: new Date().toISOString()
        };
        
        setNotifications(prev => [notification, ...prev.slice(0, 49)]);
        
        // Show system notification toast
        const toastOptions = {
          duration: 6000,
          position: 'bottom-right' as const
        };

        switch (data.type) {
          case 'error':
            toast.error(data.message, toastOptions);
            break;
          case 'warning':
            toast.warning(data.message, toastOptions);
            break;
          case 'success':
            toast.success(data.message, toastOptions);
            break;
          default:
            toast.info(data.message, toastOptions);
        }

        // Trigger event listeners
        const listeners = eventListenersRef.current.get('system:notification');
        if (listeners) {
          listeners.forEach(callback => callback(data));
        }
      });

      // Health check
      socket.on('pong', () => {
        console.log('🔍 WebSocket health check response received');
      });

      // Start health check ping
      const pingInterval = setInterval(() => {
        if (socket.connected) {
          socket.emit('ping');
        } else {
          clearInterval(pingInterval);
        }
      }, 30000); // Ping every 30 seconds

      return () => {
        clearInterval(pingInterval);
      };

    } catch (error) {
      console.error('🔌 Error creating WebSocket connection:', error);
      setConnectionError('Failed to create connection');
    }
  }, [getAuthToken]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('🔌 Manually disconnecting WebSocket');
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const emit = useCallback((event: string, data: any) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('🔌 Cannot emit event: WebSocket not connected');
    }
  }, []);

  const on = useCallback((event: string, callback: (data: any) => void) => {
    // Store callback reference
    if (!eventListenersRef.current.has(event)) {
      eventListenersRef.current.set(event, new Set());
    }
    eventListenersRef.current.get(event)!.add(callback);

    // Also register with socket if connected
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.on(event, callback);
    }

    // Return unsubscribe function
    return () => {
      const listeners = eventListenersRef.current.get(event);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          eventListenersRef.current.delete(event);
        }
      }

      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.off(event, callback);
      }
    };
  }, []);

  const off = useCallback((event: string, callback?: (data: any) => void) => {
    const listeners = eventListenersRef.current.get(event);
    if (listeners && callback) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        eventListenersRef.current.delete(event);
      }
    } else if (listeners && !callback) {
      // Remove all listeners for this event
      eventListenersRef.current.delete(event);
    }

    if (socketRef.current && socketRef.current.connected) {
      if (callback) {
        socketRef.current.off(event, callback);
      } else {
        socketRef.current.off(event);
      }
    }
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Connect on mount if user is authenticated
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [connect, disconnect, getAuthToken]);

  // Reconnect when token changes
  useEffect(() => {
    const handleStorageChange = () => {
      const newToken = getAuthToken();
      if (newToken && !isConnected) {
        connect();
      } else if (!newToken && isConnected) {
        disconnect();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [connect, disconnect, getAuthToken, isConnected]);

  return {
    socket: socketRef.current,
    isConnected,
    connectionError,
    emit,
    on,
    off,
    disconnect,
    notifications,
    clearNotifications
  };
};

export default useWebSocket;
