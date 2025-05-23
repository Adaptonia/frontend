'use client'
import React from 'react';
import ChatList from '@/components/chat/ChatList';



export default async function ChatPage() {
  // const { userId } = await params;
  return (
    <div className="flex-grow overflow-y-auto rounded-tl-3xl border-l border-gray-200 dark:border-gray-800 bg-white">
      <ChatList />
    </div>
  );
} 