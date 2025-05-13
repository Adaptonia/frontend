'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from '@/context/WebSocketContext';
import { chatApi } from '@/lib/api/chat';
import { useAuth } from '@/context/AuthContext';

// Message types
export interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId?: string;
  channelId?: string;
  read: boolean;
  createdAt: string | Date;
  sender: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
}

// Define the hook interface
interface UseDirectMessagingResult {
  messages: Message[];
  isLoading: boolean;
  isSending: boolean;
  otherUserIsTyping: boolean;
  sendMessage: (content: string) => Promise<void>;
  sendTypingIndicator: (isTyping: boolean) => void;
  markAsRead: (messageId: string) => void;
}

export function useDirectMessaging(otherUserId: string): UseDirectMessagingResult {
  const { socket, isConnected } = useWebSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [otherUserIsTyping, setOtherUserIsTyping] = useState(false);
  
  // Keep a ref to the otherUserId to use in event listeners
  const otherUserIdRef = useRef(otherUserId);
  
  // Update ref when prop changes
  useEffect(() => {
    otherUserIdRef.current = otherUserId;
  }, [otherUserId]);

  // Load initial messages from REST API
  useEffect(() => {
    const fetchMessages = async () => {
      setIsLoading(true);
      try {
        const data = await chatApi.getDirectMessages(otherUserId);
        setMessages(data);

        // Mark messages as read
        await chatApi.markMessagesAsRead(otherUserId);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (otherUserId) {
      fetchMessages();
    }
  }, [otherUserId]);

  // Listen for new messages via WebSocket
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewMessage = (message: Message) => {
      // Only add message if it's relevant to this conversation
      const isRelevantMessage = 
        (message.senderId === otherUserIdRef.current && message.receiverId === user?.id) || 
        (message.senderId === user?.id && message.receiverId === otherUserIdRef.current);
        
      if (isRelevantMessage) {
        setMessages(prev => [...prev, message]);
        
        // Mark incoming messages as read automatically
        if (message.senderId === otherUserIdRef.current && !message.read) {
          markMessageAsReadViaSocket(message.id);
        }
      }
    };
    
    // Listen for the message_received event
    socket.on('message_received', handleNewMessage);
    
    return () => {
      socket.off('message_received', handleNewMessage);
    };
  }, [socket, isConnected, user?.id]);

  // Listen for typing indicators
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleTypingIndicator = (data: { userId: string; isTyping: boolean }) => {
      if (data.userId === otherUserIdRef.current) {
        setOtherUserIsTyping(data.isTyping);
      }
    };
    
    socket.on('user_typing', handleTypingIndicator);
    
    return () => {
      socket.off('user_typing', handleTypingIndicator);
    };
  }, [socket, isConnected]);

  // Send a direct message
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !otherUserId || !user) return;
    
    setIsSending(true);
    
    try {
      // If socket is connected, send via WebSocket
      if (socket && isConnected) {
        socket.emit('send_direct_message', {
          receiverId: otherUserId,
          content: content.trim(),
        });
      } else {
        // Fallback to REST API
        const message = await chatApi.sendDirectMessage(otherUserId, content.trim());
        setMessages(prev => [...prev, message]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  }, [socket, isConnected, otherUserId, user]);

  // Send typing indicator
  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (!socket || !isConnected || !otherUserId) return;
    
    socket.emit('typing', {
      receiverId: otherUserId,
      isTyping,
    });
  }, [socket, isConnected, otherUserId]);

  // Mark message as read via WebSocket
  const markMessageAsReadViaSocket = useCallback((messageId: string) => {
    if (!socket || !isConnected) return;
    
    socket.emit('mark_message_read', { messageId });
  }, [socket, isConnected]);

  // Public method to mark messages as read
  const markAsRead = useCallback((messageId: string) => {
    markMessageAsReadViaSocket(messageId);
    
    // Update local state to reflect that the message is read
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId ? { ...msg, read: true } : msg
      )
    );
  }, [markMessageAsReadViaSocket]);

  return {
    messages,
    isLoading,
    isSending,
    otherUserIsTyping,
    sendMessage,
    sendTypingIndicator,
    markAsRead,
  };
} 