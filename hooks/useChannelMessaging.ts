'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useWebSocket, TypingIndicatorData } from '@/context/WebSocketContext';
import { useAuth } from '@/context/AuthContext';
import { 
  getChannelMessages, 
  sendChannelMessage 
} from '@/src/services/appwrite/channel';
import { subscribeToChannelMessages } from '@/src/services/appwrite/realtime';
import { ChannelMessage } from '@/lib/types/messaging';

export function useChannelMessaging(channelId: string) {
  const [messages, setMessages] = useState<ChannelMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const { socket, isConnected, sendMessage: sendWebSocketMessage } = useWebSocket();
  const { user } = useAuth();
  
  // Keep a ref to the channelId to use in event listeners
  const channelIdRef = useRef(channelId);
  
  // Update ref when channelId changes
  useEffect(() => {
    channelIdRef.current = channelId;
  }, [channelId]);

  // Load initial messages when component mounts
  useEffect(() => {
    if (!user?.id) return;
    
    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        
        const fetchedMessages = await getChannelMessages(
          channelId,
          user.id || "" // Ensure we have a string even if undefined
        );
        
        // Map to the expected format
        const formattedMessages = fetchedMessages.map(msg => ({
          ...msg,
          sender: {
            // Add placeholder sender info since we don't have it from Appwrite
            firstName: 'User',
            lastName: '',
            email: msg.senderId // Using senderId as email for now
          }
        }));
        
        setMessages(formattedMessages);
        setError(null);
      } catch (err) {
        console.error('Error fetching channel messages:', err);
        setError(err instanceof Error ? err.message : 'Failed to load messages');
      } finally {
        setIsLoading(false);
      }
    };

      fetchMessages();
  }, [channelId, user?.id]);

  // Set up Appwrite Realtime listener for persistent message data
  useEffect(() => {
    if (!user?.id) return;
    
    // Subscribe to new messages through Appwrite Realtime
    const unsubscribe = subscribeToChannelMessages(
      channelId,
      (message) => {
        if (message.type === 'new_message') {
          // Check if this message is already in our state to prevent duplicates
          setMessages(prev => {
            // If we already have this message by ID, don't add it again
            if (prev.some(msg => msg.id === message.data.id)) {
              return prev;
            }
            
            // Also check if we have a temporary message with matching content and sender
            // that should be replaced with this real message
            const tempMessageIndex = prev.findIndex(msg => 
              msg.id.startsWith('temp-') && 
              msg.senderId === message.data.senderId &&
              msg.content === message.data.content
            );
            
            if (tempMessageIndex >= 0) {
              // Replace the temporary message with the real one
              const updatedMessages = [...prev];
              updatedMessages[tempMessageIndex] = {
                ...message.data,
                sender: {
                  firstName: 'User',
                  lastName: '',
                  email: message.data.senderId || ''
                }
              };
              return updatedMessages;
            }
            
            // If no temporary message to replace, add as new
            const newMessage: ChannelMessage = {
              ...message.data,
              sender: {
                firstName: 'User',
                lastName: '',
                email: message.data.senderId || ''
              }
            };
            
            return [...prev, newMessage];
          });
          
          // Clear typing indicator for the sender
          setTypingUsers(prev => ({
            ...prev,
            [message.data.senderId]: false
          }));
        } else if (message.type === 'message_update') {
          // Update an existing message
          setMessages(prev => 
            prev.map(msg => 
              msg.id === message.data.id 
                ? {
                    ...msg,
                    content: message.data.content,
                    updatedAt: message.data.updatedAt,
                    isDeleted: message.data.isDeleted
                  }
                : msg
            )
          );
        } else if (message.type === 'message_delete') {
          // Remove a message
          setMessages(prev => 
            prev.filter(msg => msg.id !== message.data.id)
          );
        }
      },
      (error) => {
        console.error('Channel messages subscription error:', error);
        setError(`Realtime subscription failed: ${error.message}`);
      }
    );
    
    return () => {
      unsubscribe();
    };
  }, [channelId, user?.id]);

  // Set up WebSocket listeners for ephemeral data (typing indicators)
  useEffect(() => {
    if (!isConnected || !socket) return;

    // Function to handle WebSocket messages
    const handleWebSocketMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        // Check if this is a typing indicator for the current channel
        if (data.type === 'typing' && data.data.channelId === channelIdRef.current) {
          const typingData = data.data as TypingIndicatorData;
          setTypingUsers(prev => ({
            ...prev,
            [typingData.userId]: typingData.isTyping
          }));
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    };

    // Add event listener for messages
    socket.addEventListener('message', handleWebSocketMessage);

    // Join the channel via WebSocket for ephemeral events
    if (channelIdRef.current) {
      sendWebSocketMessage({
        type: 'join_channel',
        data: { channelId: channelIdRef.current }
      });
    }

    // Clean up on unmount or when channel changes
    return () => {
      socket.removeEventListener('message', handleWebSocketMessage);
      
      // Leave the channel
      if (channelIdRef.current) {
        sendWebSocketMessage({
          type: 'leave_channel',
          data: { channelId: channelIdRef.current }
        });
      }
    };
  }, [isConnected, socket, sendWebSocketMessage]);

  // Join the channel
  const joinChannel = useCallback(() => {
    if (isConnected && user?.id && channelIdRef.current) {
      sendWebSocketMessage({
        type: 'join_channel',
        data: { channelId: channelIdRef.current, userId: user.id }
      });
    }
  }, [isConnected, user?.id, sendWebSocketMessage]);

  // Send a message to the channel
  const sendChannelMessageToServer = useCallback(async (content: string): Promise<void> => {
    if (!user?.id) {
      setError('You must be logged in to send messages');
      return;
    }

    try {
      setIsSending(true);
      
      // Create a temporary ID for optimistic update
      const tempId = `temp-${Date.now()}`;
      
      // Add optimistic message immediately
      const optimisticMessage: ChannelMessage = {
        id: tempId,
        channelId,
        senderId: user.id,
        content,
        replyToId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDeleted: false,
        sender: {
          firstName: user.name?.split(' ')[0] || 'User',
          lastName: user.name?.split(' ')[1] || '',
          email: user.email || user.id || ''
        }
      };
      
      // Add to local state for immediate UI update
      setMessages(prev => [...prev, optimisticMessage]);
      
      // Call typing indicator when sending a message
      if (isConnected && user?.id && channelIdRef.current) {
        sendWebSocketMessage({
          type: 'typing',
          data: {
            channelId: channelIdRef.current,
            userId: user.id,
            isTyping: false
          }
        });
      }
      
      // Send the actual message via Appwrite
      const message = await sendChannelMessage(
        channelId,
        user.id,
        content
      );
      
      // Replace the temporary message with the real one
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempId 
            ? {
                ...message,
                sender: {
                  firstName: user.name?.split(' ')[0] || 'User',
                  lastName: user.name?.split(' ')[1] || '',
                  email: user.email || user.id || ''
                }
              } as ChannelMessage
            : msg
        )
      );
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  }, [channelId, user, isConnected, sendWebSocketMessage]);

  // Send typing indicator via WebSocket
  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (!isConnected || !user?.id || !channelIdRef.current) return;

    sendWebSocketMessage({
      type: 'typing',
      data: {
        channelId: channelIdRef.current,
        userId: user.id,
        isTyping
      }
    });
  }, [isConnected, user?.id, sendWebSocketMessage]);

  // Convert typing users object to a readable string
  const typingIndicatorText = useMemo(() => {
    const typingUserIds = Object.entries(typingUsers)
      .filter(([userId, isTyping]) => isTyping && userId !== user?.id)
      .map(([userId]) => userId);

    if (typingUserIds.length === 0) return '';
    if (typingUserIds.length === 1) return `Someone is typing...`;
    if (typingUserIds.length === 2) return `Multiple people are typing...`;
    return `Several people are typing...`;
  }, [typingUsers, user?.id]);

  // Helper method for the typing event handler
  const onUserTyping = useCallback(() => {
    sendTypingIndicator(true);
  }, [sendTypingIndicator]);

  return {
    messages,
    isLoading,
    isSending,
    error,
    typingUsers: Object.keys(typingUsers).filter(id => typingUsers[id]),
    sendMessage: sendChannelMessageToServer,
    sendTypingIndicator,
    joinChannel,
    typingIndicatorText,
    onUserTyping,
  };
} 

export default useChannelMessaging; 