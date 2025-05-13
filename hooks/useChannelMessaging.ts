'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from '@/context/WebSocketContext';
import { useAuth } from '@/context/AuthContext';
import { channelApi } from '@/lib/api/channel';
import { Message } from '@/lib/api/chat';
import { useChannelTyping, UseChannelTypingResult } from './useChannelTyping';

// Define typing users interface
interface TypingUser {
  userId: string;
  timestamp: number;
}

export interface UseChannelMessagingResult {
  messages: Message[];
  isLoading: boolean;
  isSending: boolean;
  typingUsers: string[];
  sendMessage: (content: string) => Promise<void>;
  sendTypingIndicator: (isTyping: boolean) => void;
  joinChannel: () => void;
  leaveChannel: () => void;
  typingIndicatorText: string;
  onUserTyping: () => void;
}

// How long typing indicator should remain active (ms)
const TYPING_TIMEOUT = 5000;

export function useChannelMessaging(channelId: string): UseChannelMessagingResult {
  const { socket, isConnected } = useWebSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [typingUsersMap, setTypingUsersMap] = useState<Map<string, TypingUser>>(new Map());
  
  // Keep a ref to the channelId to use in event listeners
  const channelIdRef = useRef(channelId);
  
  // Derived state for currently typing users
  const typingUsers = Array.from(typingUsersMap.keys());
  
  const { typingIndicatorText, onUserTyping, typingUsers: typingUsersResult } = useChannelTyping(channelId);
  
  // Update ref when prop changes
  useEffect(() => {
    channelIdRef.current = channelId;
  }, [channelId]);

  // Load initial messages from REST API
  useEffect(() => {
    const fetchMessages = async () => {
      setIsLoading(true);
      try {
        const data = await channelApi.getChannelMessages(channelId);
        setMessages(data);
      } catch (error) {
        console.error('Failed to fetch channel messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (channelId) {
      fetchMessages();
    }
  }, [channelId]);

  // Clean up typing indicators after timeout
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      
      setTypingUsersMap(prev => {
        const newMap = new Map(prev);
        let hasChanges = false;
        
        for (const [userId, data] of newMap.entries()) {
          if (now - data.timestamp > TYPING_TIMEOUT) {
            newMap.delete(userId);
            hasChanges = true;
          }
        }
        
        return hasChanges ? newMap : prev;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Join channel via WebSocket
  const joinChannel = useCallback(() => {
    if (!socket || !isConnected || !channelId) return;
    
    socket.emit('join_channel', { channelId });
  }, [socket, isConnected, channelId]);
  
  // Leave channel via WebSocket
  const leaveChannel = useCallback(() => {
    if (!socket || !isConnected || !channelId) return;
    
    socket.emit('leave_channel', { channelId });
  }, [socket, isConnected, channelId]);

  // Automatically join channel when socket connects
  useEffect(() => {
    if (socket && isConnected && channelId) {
      joinChannel();
    }
    
    return () => {
      if (socket && isConnected && channelId) {
        leaveChannel();
      }
    };
  }, [socket, isConnected, channelId, joinChannel, leaveChannel]);

  // Listen for new channel messages via WebSocket
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewMessage = (message: Message) => {
      // Only add message if it's for this channel
      if (message.channelId === channelIdRef.current) {
        setMessages(prev => {
          // Check if we already have this message (e.g., from optimistic update)
          const messageExists = prev.some(m => 
            m.id === message.id || 
            (m.id.startsWith('temp-') && m.content === message.content)
          );
          
          if (messageExists) {
            // Replace temp message with real one
            return prev.map(m => 
              (m.id.startsWith('temp-') && m.content === message.content) ? message : m
            );
          }
          
          return [...prev, message];
        });
      }
    };
    
    // Listen for the channel_message_received event
    socket.on('channel_message_received', handleNewMessage);
    
    return () => {
      socket.off('channel_message_received', handleNewMessage);
    };
  }, [socket, isConnected]);

  // Listen for typing indicators
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleTypingIndicator = (data: { userId: string; channelId: string; isTyping: boolean }) => {
      if (data.channelId === channelIdRef.current && data.userId !== user?.id) {
        setTypingUsersMap(prev => {
          const newMap = new Map(prev);
          
          if (data.isTyping) {
            newMap.set(data.userId, { 
              userId: data.userId, 
              timestamp: Date.now() 
            });
          } else {
            newMap.delete(data.userId);
          }
          
          return newMap;
        });
      }
    };
    
    socket.on('user_typing', handleTypingIndicator);
    
    return () => {
      socket.off('user_typing', handleTypingIndicator);
    };
  }, [socket, isConnected, user?.id]);

  // Send message function
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !channelId || !user?.id || !user?.email) return;
    
    setIsSending(true);
    
    try {
      const userName = user.name || user.email.split('@')[0];
      const [firstName, lastName] = userName.split(' ');

      // Create temporary message for optimistic update
      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        content: content.trim(),
        senderId: user.id,
        channelId,
        createdAt: new Date().toISOString(),
        sender: {
          id: user.id,
          firstName: firstName || 'User',
          lastName: lastName || '',
          email: user.email
        }
      };
      
      // Optimistic update
      setMessages(prev => [...prev, tempMessage]);
      
      // Send via WebSocket if connected
      if (socket && isConnected) {
        socket.emit('send_channel_message', {
          channelId,
          content: content.trim()
        });
      } else {
        // Fallback to REST API
        const message = await channelApi.sendChannelMessage(channelId, content.trim());
        // Replace temp message with real one
        setMessages(prev => prev.map(msg => 
          msg.id === tempMessage.id ? message : msg
        ));
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => msg.id !== `temp-${Date.now()}`));
    } finally {
      setIsSending(false);
    }
  }, [socket, isConnected, channelId, user]);

  // Send typing indicator
  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (!socket || !isConnected || !channelId) return;
    
    socket.emit('typing', {
      channelId,
      isTyping,
      userName: user?.name || user?.email?.split('@')[0] || 'Anonymous'
    });
  }, [socket, isConnected, channelId, user]);

  return {
    messages,
    isLoading,
    isSending,
    typingUsers: typingUsersResult.map(u => u.id),
    sendMessage,
    sendTypingIndicator,
    joinChannel,
    leaveChannel,
    typingIndicatorText,
    onUserTyping
  };
} 