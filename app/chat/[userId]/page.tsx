'use client'
import React from 'react';
import ChatRoom from '@/components/chat/ChatRoom';
import ChatList from '@/components/chat/ChatList';

interface ChatDetailPageProps {
  params: {
    userId: string;
  };
}

export default function ChatDetailPage({ params }: ChatDetailPageProps) {
  return (
    <div className="flex h-full">
      {/* Chat List Sidebar */}
      <div className="flex-shrink-0 w-72 border-r rounded-tl-3xl border-gray-200 dark:border-gray-800 overflow-y-auto bg-white">
        <ChatList />
      </div>

      {/* Chat Room */}
      <div className="flex-grow overflow-hidden">
        <ChatRoom otherUserId={params.userId} />
      </div>
    </div>
  );
} 