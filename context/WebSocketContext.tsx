'use client';

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

// Define types for our context
interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  onlineUsers: Set<string>;
}

// Create context with default values
const WebSocketContext = createContext<WebSocketContextType>({
  socket: null,
  isConnected: false,
  connect: () => {},
  disconnect: () => {},
  onlineUsers: new Set<string>(),
});

// Environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  
  // Use a ref to avoid stale closures
  const socketRef = useRef<Socket | null>(null);

  const handleConnect = useCallback(() => {
    setIsConnected(true);
    console.log('WebSocket connected');
  }, []);

  const handleDisconnect = useCallback(() => {
    setIsConnected(false);
    console.log('WebSocket disconnected');
  }, []);

  const handleUserStatusChange = useCallback((data: { userId: string; isOnline: boolean }) => {
    console.log('User status change:', data);
    setOnlineUsers(prev => {
      const newSet = new Set(prev);
      if (data.isOnline) {
        newSet.add(data.userId);
      } else {
        newSet.delete(data.userId);
      }
      return newSet;
    });
  }, []);

  const connect = useCallback(() => {
    // Don't reconnect if we already have a socket or if user isn't logged in
    if (socketRef.current || !user) {
      console.log('Not connecting WebSocket:', { hasSocket: !!socketRef.current, hasUser: !!user });
      return;
    }

    console.log('Creating WebSocket connection to:', `${API_URL}/chat`);
    
    // Create socket connection with withCredentials to send cookies
    const newSocket = io(`${API_URL}/chat`, {
      withCredentials: true, // This will send cookies with the request
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'], // Try WebSocket first, then fall back to polling
    });

    // Set up event listeners
    newSocket.on('connect', handleConnect);
    newSocket.on('disconnect', handleDisconnect);
    newSocket.on('connect_error', (err) => {
      console.error('WebSocket connection error:', err.message);
      console.error('Connection error details:', err);
      
      // Check for cookies
      if (typeof document !== 'undefined') {
        console.log('Available cookies:', document.cookie);
      }
    });
    
    // Listen for user status changes
    newSocket.on('user_status_change', handleUserStatusChange);
    
    // Debug other events
    newSocket.onAny((event, ...args) => {
      console.log(`WebSocket event: ${event}`, args);
    });

    // Store socket in state and ref
    setSocket(newSocket);
    socketRef.current = newSocket;
  }, [user, handleConnect, handleDisconnect, handleUserStatusChange]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    }
  }, []);

  // Connect when user logs in
  useEffect(() => {
    if (user) {
      connect();
    } else {
      disconnect();
    }
    
    // Clean up on component unmount
    return () => {
      disconnect();
    };
  }, [user, connect, disconnect]);

  // Value to be provided by the context
  const value = {
    socket,
    isConnected,
    connect,
    disconnect,
    onlineUsers,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

// Custom hook to use the WebSocket context
export function useWebSocket() {
  const context = useContext(WebSocketContext);
  
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  
  return context;
} 