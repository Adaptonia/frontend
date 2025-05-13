'use client';

import { useWebSocket } from '@/context/WebSocketContext';
import { useCallback } from 'react';

export function useUserStatus() {
  const { onlineUsers } = useWebSocket();
  
  // Check if a specific user is online
  const isUserOnline = useCallback((userId: string): boolean => {
    return onlineUsers.has(userId);
  }, [onlineUsers]);
  
  return {
    onlineUsers,
    isUserOnline,
  };
} 