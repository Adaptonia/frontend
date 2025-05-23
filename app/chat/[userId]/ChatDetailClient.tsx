// app/chat/[userId]/ChatDetailClient.tsx
'use client'
import React, { useEffect } from 'react';
import ChatRoom from '@/components/chat/ChatRoom';
import ChatList from '@/components/chat/ChatList';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface ChatDetailClientProps {
  userId: string;
}

export default function ChatDetailClient({ userId }: ChatDetailClientProps) {
  const { user } = useAuth();
  const router = useRouter();
  
  // Check if user is authenticated
  useEffect(() => {
    if (!user?.id) {
      router.push('/login'); // Redirect to login if not authenticated
    }
  }, [user, router]);
  
  return (
    <div className="flex h-full">
      {/* Chat List Sidebar */}
      <div className="flex-shrink-0 w-72 border-r rounded-tl-3xl border-gray-200 dark:border-gray-800 overflow-y-auto bg-white">
        <ChatList />
      </div>

      {/* Chat Room */}
      <div className="flex-grow overflow-hidden">
        <ChatRoom otherUserId={userId} />
      </div>
    </div>
  );
}