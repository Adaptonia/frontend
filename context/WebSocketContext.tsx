'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

// Define WebSocket message types for ephemeral data only
export type EphemeralEventType = 
  | 'typing'
  | 'online_status'
  | 'reading_message'
  | 'join_channel'
  | 'leave_channel';

export type WebSocketMessage = {
  type: EphemeralEventType;
  data: any;
};

// Define typing indicator data
export type TypingIndicatorData = {
  channelId: string;
  userId: string;
  isTyping: boolean;
};

// Define the context type
type WebSocketContextType = {
  socket: WebSocket | null;
  isConnected: boolean;
  sendMessage: (message: WebSocketMessage) => void;
  onlineUsers: Set<string>;
};

// Create the context
const WebSocketContext = createContext<WebSocketContextType | null>(null);

// WebSocket provider component
export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  
  // Main connection effect
  useEffect(() => {
    // Only connect if the user is logged in
    if (!user?.id) {
      if (socket) {
        socket.close();
        setSocket(null);
    setIsConnected(false);
      }
      return;
    }

    // Get WebSocket URL from environment or use default
    const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'wss://your-websocket-endpoint.com';
    
    // Create WebSocket connection
    const ws = new WebSocket(`${wsUrl}?userId=${user.id}`);

    // Set up event listeners
    ws.onopen = () => {
      console.log('WebSocket connection established for ephemeral events');
      setIsConnected(true);
      
      // Send initial presence when connected
      ws.send(JSON.stringify({
        type: 'online_status',
        data: { 
          userId: user.id,
          isOnline: true,
          timestamp: new Date().toISOString()
        }
      }));
    };
    
    ws.onclose = () => {
      console.log('WebSocket connection closed');
      setIsConnected(false);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };
    
    setSocket(ws);
    
    // Set up ping interval to keep connection alive
    const pingInterval = setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // 30 seconds
    
    // Set up activity tracker
    const trackActivity = () => {
      if (ws && ws.readyState === WebSocket.OPEN && user?.id) {
        ws.send(JSON.stringify({
          type: 'online_status',
          data: { 
            userId: user.id,
            isOnline: true,
            timestamp: new Date().toISOString()
          }
        }));
      }
    };
    
    // Track user activity
    window.addEventListener('mousemove', trackActivity);
    window.addEventListener('keydown', trackActivity);
    document.addEventListener('visibilitychange', () => {
      if (ws && ws.readyState === WebSocket.OPEN && user?.id) {
        ws.send(JSON.stringify({
          type: 'online_status',
          data: { 
            userId: user.id,
            isOnline: !document.hidden,
            timestamp: new Date().toISOString()
          }
        }));
      }
    });
    
    // Clean up on unmount
    return () => {
      // Send offline status before closing
      if (ws.readyState === WebSocket.OPEN && user?.id) {
        ws.send(JSON.stringify({
          type: 'online_status',
          data: { 
            userId: user.id,
            isOnline: false,
            timestamp: new Date().toISOString()
          }
        }));
      }
      
      clearInterval(pingInterval);
      window.removeEventListener('mousemove', trackActivity);
      window.removeEventListener('keydown', trackActivity);
      
      // Close WebSocket connection
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [user?.id]);

  // Separate effect for handling messages (was nested before)
  useEffect(() => {
    if (!socket) return;
    
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'online_status') {
          const { userId, isOnline } = data.data;
          setOnlineUsers(prev => {
            const newSet = new Set(prev);
            if (isOnline) {
              newSet.add(userId);
    } else {
              newSet.delete(userId);
            }
            return newSet;
          });
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    socket.addEventListener('message', handleMessage);
    
    return () => {
      socket.removeEventListener('message', handleMessage);
    };
  }, [socket]);

  // Method to send messages
  const sendMessage = (message: WebSocketMessage) => {
    if (socket && isConnected) {
      socket.send(JSON.stringify(message));
    } else {
      console.warn('Cannot send message: WebSocket not connected');
    }
  };

  return (
    <WebSocketContext.Provider value={{ socket, isConnected, sendMessage, onlineUsers }}>
      {children}
    </WebSocketContext.Provider>
  );
};

// Custom hook to use the WebSocket context
export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}; 