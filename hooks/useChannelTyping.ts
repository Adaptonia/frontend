import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from '@/context/WebSocketContext';
import { useAuth } from '@/context/AuthContext';
import debounce from 'lodash/debounce';

export interface TypingUser {
  id: string;
  name: string;
  timestamp: number;
}

export interface UseChannelTypingResult {
  typingUsers: TypingUser[];
  onUserTyping: () => void;
  typingIndicatorText: string;
}

export function useChannelTyping(channelId: string): UseChannelTypingResult {
  const { socket, isConnected } = useWebSocket();
  const { user } = useAuth();
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [typingIndicatorText, setTypingIndicatorText] = useState('');
  const typingTimeoutRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

  // Update typing indicator text whenever typingUsers changes
  useEffect(() => {
    console.log('typingUsers', typingIndicatorText);
    if (typingUsers.length === 0) {
      setTypingIndicatorText('');
    } else if (typingUsers.length === 1) {
      setTypingIndicatorText(`${typingUsers[0].name} is typing...`);
    } else if (typingUsers.length === 2) {
      setTypingIndicatorText(`${typingUsers[0].name} and ${typingUsers[1].name} are typing...`);
    } else {
      setTypingIndicatorText(`${typingUsers[0].name} and ${typingUsers.length - 1} others are typing...`);
    }
  }, [typingUsers]);

  // Clean up typing indicator after 3 seconds of no updates
  const removeTypingUser = useCallback((userId: string) => {
    setTypingUsers(prev => prev.filter(user => user.id !== userId));
  }, []);

  // Handle incoming typing indicators
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleTypingMessage = (event: MessageEvent) => {
      try {
        const parsedData = JSON.parse(event.data);
        if (parsedData.event !== 'user_typing') return;
        
        const data = parsedData.data;
        console.log('Received typing event:', data);
        
        // Validate channelId match and filter out self-typing events
        if (data.channelId !== channelId) {
          console.log(`Ignoring typing event - wrong channel (received ${data.channelId}, expected ${channelId})`);
          return;
        }
        
        if (data.userId === user?.id) {
          console.log('Ignoring self typing event');
          return;
        }

        if (data.isTyping) {
          console.log(`Adding typing user: ${data.userName} (${data.userId})`);
          setTypingUsers(prev => {
            // Remove existing user if present
            const filtered = prev.filter(u => u.id !== data.userId);
            return [...filtered, { 
              id: data.userId, 
              name: data.userName || 'Anonymous',
              timestamp: Date.now() 
            }];
          });

          // Clear existing timeout for this user
          if (typingTimeoutRef.current[data.userId]) {
            clearTimeout(typingTimeoutRef.current[data.userId]);
          }

          // Set new timeout
          typingTimeoutRef.current[data.userId] = setTimeout(() => {
            console.log(`Typing timeout for user: ${data.userId}`);
            removeTypingUser(data.userId);
          }, 3000);
        } else {
          console.log(`User stopped typing: ${data.userId}`);
          removeTypingUser(data.userId);
        }
      } catch (error) {
        console.error('Error parsing typing message:', error);
      }
    };

    socket.addEventListener('message', handleTypingMessage);

    return () => {
      socket.removeEventListener('message', handleTypingMessage);
      // Clear all timeouts
      Object.values(typingTimeoutRef.current).forEach(clearTimeout);
    };
  }, [socket, isConnected, channelId, user?.id, removeTypingUser]);

  // Debounced function to emit typing status
  const debouncedEmitTyping = useCallback(
    debounce((isTyping: boolean) => {
      if (!socket || !isConnected || !channelId || !user) {
        console.log('Cannot emit typing - missing dependencies:', { socket, isConnected, channelId, user });
        return;
      }

      console.log('Emitting typing event:', { channelId, isTyping, userName: user.name || user.email || 'Anonymous' });
      socket.send(JSON.stringify({
        event: 'typing',
        data: {
          channelId,
          isTyping,
          userName: user.name || user.email || 'Anonymous'
        }
      }));
    }, 300),
    [socket, isConnected, channelId, user]
  );

  // Function to be called when user is typing
  const onUserTyping = useCallback(() => {
    debouncedEmitTyping(true);
    // Automatically emit stop typing after 3 seconds
    setTimeout(() => debouncedEmitTyping(false), 3000);
  }, [debouncedEmitTyping]);

  return {
    typingUsers,
    onUserTyping,
    typingIndicatorText
  };
} 