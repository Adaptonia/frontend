'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useChannelMessaging } from '@/hooks/useChannelMessaging';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, ArrowLeft, Users, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { TypingIndicator } from '@/components/ui/TypingIndicator';
import { channelApi } from '@/lib/api/channel';
import { getInitials, formatTime } from '@/lib/utils';
import { Channel } from '@/lib/api/channel';

interface ChannelRoomProps {
  channelId: string;
  onBack?: () => void;
}

export default function ChannelRoom({ channelId, onBack }: ChannelRoomProps) {
  const [newMessage, setNewMessage] = useState('');
  const [channel, setChannel] = useState<Channel | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const { user } = useAuth();
  
  // Use the WebSocket-enabled hook for channel messaging
  const {
    messages,
    isLoading,
    isSending,
    typingUsers,
    sendMessage,
    sendTypingIndicator,
    onUserTyping,
    typingIndicatorText: typingText
  } = useChannelMessaging(channelId);

  // Fetch channel details
  useEffect(() => {
    const fetchChannel = async () => {
      try {
        const channelData = await channelApi.getChannelById(channelId);
        setChannel(channelData);
      } catch (error) {
        console.error('Failed to fetch channel:', error);
      }
    };

    if (channelId) {
      fetchChannel();
    }
  }, [channelId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle typing indicators with debounce
  useEffect(() => {
    // Clear any existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Only send typing events if there's content
    if (newMessage.trim().length > 0) {
      onUserTyping();
    }
    
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [newMessage, onUserTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !channelId) return;

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

  // Generate typing indicator text - use the one from hook instead
  const typingIndicatorText = () => typingText;
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-full">Loading channel...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Channel header */}
      <div className="border-b p-4 flex items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onBack || (() => router.push('/channels'))}
          className="mr-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="ml-1 flex-grow">
          <h2 className="font-medium flex items-center">
            <span className="text-gray-500 mr-2">#</span>
            {channel?.name || 'Channel'}
          </h2>
          <p className="text-sm text-gray-500">{channel?.description || ''}</p>
        </div>
        
        <Button variant="ghost" size="icon" className="mr-2">
          <Users className="h-5 w-5" />
        </Button>
        
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Messages */}
      <div className="flex-grow overflow-y-auto p-4">
        {Object.keys(messagesByDate).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-gray-500 mb-2">No messages yet</p>
            <p className="text-gray-400 text-sm">Be the first to send a message in this channel</p>
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
                
                return (
                  <div 
                    key={message.id} 
                    className="flex mb-3"
                  >
                    <Avatar className="h-8 w-8 mr-2 self-start mt-1">
                      <AvatarImage 
                        src={message.sender.firstName && message.sender.lastName ? 
                          `https://api.dicebear.com/7.x/initials/svg?seed=${message.sender.firstName} ${message.sender.lastName}` : 
                          undefined} 
                      />
                      <AvatarFallback>
                        {getInitials(message.sender.firstName, message.sender.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="font-medium mr-2">
                          {message.sender.firstName && message.sender.lastName 
                            ? `${message.sender.firstName} ${message.sender.lastName}` 
                            : message.sender.email}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatTime(message.createdAt)}
                        </span>
                      </div>
                      <div className="mt-1">
                        <p>{message.content}</p>
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
      
      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className="px-4 py-1 border-t">
          <TypingIndicator isTyping={true} text={typingIndicatorText()} />
        </div>
      )}
      
      {/* Message input */}
      <div className="border-t p-4">
        <form onSubmit={handleSendMessage} className="flex">
          <Input
            type="text"
            placeholder={`Message #${channel?.name || 'channel'}`}
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