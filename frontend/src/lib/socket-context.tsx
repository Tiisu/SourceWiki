import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './auth-context';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
  children: ReactNode;
}

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      // Disconnect if user logs out
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Get token from localStorage
    const token = localStorage.getItem('accessToken');

    if (!token) {
      return;
    }

    // Don't reconnect if already connected with the same user
    if (socket && socket.connected) {
      return;
    }

    // Initialize Socket.io connection
    const newSocket = io(SOCKET_URL, {
      auth: {
        token: token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('Socket.io connected');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket.io disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket.io connection error:', error);
      setIsConnected(false);
    });

    setSocket(newSocket);

    // Cleanup on unmount or user change
    return () => {
      if (newSocket) {
        newSocket.close();
      }
      setSocket(null);
      setIsConnected(false);
    };
  }, [user?.id]); // Only depend on user.id to avoid unnecessary reconnections

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

