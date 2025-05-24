'use client';

import React, { useRef, useEffect } from 'react';
import { useChannelMessaging } from '@/hooks/useChannelMessaging';
import { useAuth } from '@/context/AuthContext';
import { ChannelMessage } from '@/lib/types/messaging';

interface ChannelChatProps {
  channelId: string;
}

export function ChannelChat({ channelId }: ChannelChatProps) {
  const {
    messages,
    isLoading,
    isSending,
    sendMessage,
    typingIndicatorText,
    onUserTyping
  } = useChannelMessaging(channelId);
  
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messageInput, setMessageInput] = React.useState('');

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    await sendMessage(messageInput);
    setMessageInput('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageInput(e.target.value);
    onUserTyping();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages container */}
      <div className="flex-1 scrollable p-4 space-y-4">
        {messages.map((message: ChannelMessage) => (
          <div
            key={message.id}
            className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                message.senderId === user?.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800'
              }`}
            >
              {message.senderId !== user?.id && message.sender && (
                <div className="text-sm font-medium mb-1 text-gray-500 dark:text-gray-400">
                  {message.sender.firstName} {message.sender.lastName}
                </div>
              )}
              <div className="break-words">{message.content}</div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator */}
      {typingIndicatorText && (
        <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
          {typingIndicatorText}
        </div>
      )}

      {/* Message input */}
      <form onSubmit={handleSendMessage} className="border-t dark:border-gray-800 p-4">
        <div className="flex space-x-2">
          <textarea
            value={messageInput}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="flex-1 resize-none rounded-lg border dark:border-gray-700 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={isSending || !messageInput.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
} 