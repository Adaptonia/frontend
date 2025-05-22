'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { chatApi } from '@/lib/api/chat';
import { subscribeToDirectMessages } from '@/src/services/appwrite/realtime';

// Message types
export interface Message {
  id: string;
  content: string;
  senderId: string;
  recipientId?: string;
  createdAt: string | Date;
  isRead: boolean;
  isDeleted: boolean;
  replyToId?: string | null;
  sender?: {
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
  sendMessage: (content: string) => Promise<void>;
  markAsRead: (messageId: string) => void;
}

export function useDirectMessaging(otherUserId: string): UseDirectMessagingResult {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  // Keep a ref to the otherUserId to use in event listeners
  const otherUserIdRef = useRef(otherUserId);
  
  // Update ref when prop changes
  useEffect(() => {
    otherUserIdRef.current = otherUserId;
  }, [otherUserId]);

  // Load initial messages from API
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

    if (otherUserId && user?.id) {
      fetchMessages();
    }
  }, [otherUserId, user?.id]);

  // Set up real-time listener for new messages
  useEffect(() => {
    if (!user?.id || !otherUserId) return;

    // Subscribe to direct messages between the current user and other user
    const unsubscribe = subscribeToDirectMessages(
      user.id,
      otherUserId,
      (messageEvent) => {
        if (messageEvent.type === 'new_message') {
          const newMessage = messageEvent.data;
          
          // Add message to our list
          setMessages(prev => [...prev, {
            id: newMessage.id,
            content: newMessage.content,
            senderId: newMessage.senderId,
            recipientId: newMessage.recipientId,
            createdAt: newMessage.createdAt,
            isRead: newMessage.isRead,
            isDeleted: newMessage.isDeleted,
            replyToId: newMessage.replyToId,
          }]);
          
          // If the message is from the other user, mark it as read
          if (newMessage.senderId === otherUserId) {
            markAsRead(newMessage.id);
          }
        } else if (messageEvent.type === 'message_update') {
          // Update the message in our list
          setMessages(prev => 
            prev.map(msg => 
              msg.id === messageEvent.data.id 
                ? {
                    ...msg,
                    content: messageEvent.data.content,
                    isRead: messageEvent.data.isRead,
                    isDeleted: messageEvent.data.isDeleted,
                  } 
                : msg
            )
          );
        } else if (messageEvent.type === 'message_delete') {
          // Remove or mark as deleted in our list
          setMessages(prev => 
            prev.map(msg => 
              msg.id === messageEvent.data.id 
                ? { ...msg, isDeleted: true } 
                : msg
            )
          );
        }
      },
      (error) => {
        console.error('Error in direct message subscription:', error);
      }
    );
    
    // Clean up subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [user?.id, otherUserId]);

  // Send a direct message
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !otherUserId || !user?.id) return;
    
    setIsSending(true);
    
    try {
        const message = await chatApi.sendDirectMessage(otherUserId, content.trim());
      
      // No need to update messages state as the real-time listener will catch this
    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Optimistically add the message to the UI in case of real-time failure
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        content: content.trim(),
        senderId: user.id,
        recipientId: otherUserId,
        createdAt: new Date().toISOString(),
        isRead: false,
        isDeleted: false,
      };
      
      setMessages(prev => [...prev, optimisticMessage]);
    } finally {
      setIsSending(false);
    }
  }, [otherUserId, user?.id]);

  // Mark a message as read
  const markAsRead = useCallback(async (messageId: string) => {
    if (!user?.id) return;
    
    try {
      // Update in the backend
      await chatApi.markMessagesAsRead(otherUserId);
      
      // Update in local state
    setMessages(prev => 
      prev.map(msg => 
          msg.id === messageId ? { ...msg, isRead: true } : msg
      )
    );
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  }, [otherUserId, user?.id]);

  return {
    messages,
    isLoading,
    isSending,
    sendMessage,
    markAsRead,
  };
} 