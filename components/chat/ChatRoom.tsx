'use client'
import React, { useState, useEffect, useRef } from 'react';
import { useDirectMessaging } from '@/hooks/useDirectMessaging';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, ArrowLeft, MoreVertical } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserStatusBadge } from '@/components/ui/UserStatusBadge';
import { TypingIndicator } from '@/components/ui/TypingIndicator';
import { chatApi } from '@/lib/api/chat';
import { getInitials, formatTime } from '@/lib/utils';

interface ChatRoomProps {
  otherUserId: string;
  onBack?: () => void;
}

export default function ChatRoom({ otherUserId, onBack }: ChatRoomProps) {
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState<{ 
    id: string; 
    firstName?: string; 
    lastName?: string; 
    email: string; 
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const { user } = useAuth();
  
  // Use the WebSocket-enabled hook for direct messaging
  const {
    messages,
    isLoading,
    isSending,
    otherUserIsTyping,
    sendMessage,
    sendTypingIndicator,
    markAsRead,
  } = useDirectMessaging(otherUserId);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // If other user is not set from messages, get it from the first message
  useEffect(() => {
    if (messages.length > 0 && !otherUser) {
      const firstMessage = messages[0];
      const isOtherUserSender = firstMessage.sender.id !== user?.id;
      
      if (isOtherUserSender) {
        setOtherUser(firstMessage.sender);
      } else if (firstMessage.receiverId === otherUserId) {
        // Attempt to get receiver info from API or other message
        // For now, set with limited info
        setOtherUser({
          id: otherUserId,
          email: 'user@example.com',
        });
      }
    }
  }, [messages, otherUser, otherUserId, user?.id]);

  // Handle typing indicators with debounce
  useEffect(() => {
    // Clear any existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Only send typing events if there's content
    if (newMessage.trim().length > 0) {
      sendTypingIndicator(true);
      
      // Set a timeout to stop the typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingIndicator(false);
      }, 3000);
    } else {
      sendTypingIndicator(false);
    }
    
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [newMessage, sendTypingIndicator]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !otherUserId) return;

    await sendMessage(newMessage);
    setNewMessage('');
  };

  // Group messages by date
  const messagesByDate = messages.reduce<{ [date: string]: typeof messages }>((groups, message) => {
    const date = new Date(message.createdAt).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  if (isLoading) {
    return <div className="flex justify-center items-center h-full">Loading messages...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="border-b p-4 flex items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onBack || (() => router.push('/chat'))}
          className="mr-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="relative">
          <Avatar className="h-10 w-10">
            <AvatarImage 
              src={otherUser?.firstName && otherUser?.lastName ? 
                `https://api.dicebear.com/7.x/initials/svg?seed=${otherUser.firstName} ${otherUser.lastName}` : 
                undefined} 
            />
            <AvatarFallback>
              {getInitials(otherUser?.firstName, otherUser?.lastName)}
            </AvatarFallback>
          </Avatar>
          {otherUser && (
            <UserStatusBadge 
              userId={otherUser.id} 
              className="absolute bottom-0 right-0"
            />
          )}
        </div>
        
        <div className="ml-3 flex-grow">
          <h2 className="font-medium">
            {otherUser?.firstName && otherUser?.lastName 
              ? `${otherUser.firstName} ${otherUser.lastName}` 
              : otherUser?.email || 'Unknown User'}
          </h2>
          <TypingIndicator isTyping={otherUserIsTyping} text="typing..." />
        </div>
        
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Messages */}
      <div className="flex-grow overflow-y-auto p-4">
        {Object.keys(messagesByDate).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-gray-500 mb-2">No messages yet</p>
            <p className="text-gray-400 text-sm">Send a message to start the conversation</p>
          </div>
        ) : (
          Object.entries(messagesByDate).map(([date, dateMessages]) => (
            <div key={date} className="mb-6">
              <div className="text-center mb-4">
                <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full">
                  {format(new Date(date), 'MMMM d, yyyy')}
                </span>
              </div>
              
              {dateMessages.map((message) => {
                const isCurrentUser = message.sender.id === user?.id;
                
                // Mark incoming messages as read when rendered
                if (!isCurrentUser && !message.read) {
                  markAsRead(message.id);
                }
                
                return (
                  <div 
                    key={message.id} 
                    className={`flex mb-3 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isCurrentUser && (
                      <Avatar className="h-8 w-8 mr-2 self-end">
                        <AvatarImage 
                          src={message.sender.firstName && message.sender.lastName ? 
                            `https://api.dicebear.com/7.x/initials/svg?seed=${message.sender.firstName} ${message.sender.lastName}` : 
                            undefined} 
                        />
                        <AvatarFallback>
                          {getInitials(message.sender.firstName, message.sender.lastName)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className={`max-w-[70%] ${isCurrentUser ? 'bg-blue-500 text-white' : 'bg-gray-100'} rounded-2xl px-4 py-2`}>
                      <p>{message.content}</p>
                      <div className={`flex items-center justify-end text-xs mt-1 ${isCurrentUser ? 'text-blue-100' : 'text-gray-500'}`}>
                        {formatTime(message.createdAt)}
                        {isCurrentUser && message.read && (
                          <span className="ml-1">✓</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message input */}
      <div className="border-t p-4">
        <form onSubmit={handleSendMessage} className="flex">
          <Input
            type="text"
            placeholder="Type a message"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-grow mr-2"
            disabled={isSending}
          />
          <Button type="submit" disabled={!newMessage.trim() || isSending}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
} 