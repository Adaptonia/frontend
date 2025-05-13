'use client'
import React, { useState, useEffect } from 'react';
import { ChatPreview, chatApi } from '@/lib/api/chat';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ChatList() {
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const data = await chatApi.getRecentChats();
        setChats(data);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch chats:', error);
        setIsLoading(false);
      }
    };

    fetchChats();
  }, []);

  // Filter chats based on search term
  const filteredChats = chats.filter(chat => {
    const fullName = `${chat.user.firstName || ''} ${chat.user.lastName || ''}`.trim().toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) || 
           chat.user.email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Function to navigate to chat with a user
  const navigateToChat = (userId: string) => {
    router.push(`/chat/${userId}`);
  };

  // Function to get initials from name
  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return '?';
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`;
  };

  // Function to render message preview
  const getMessagePreview = (message: string) => {
    return message.length > 30 ? `${message.substring(0, 30)}...` : message;
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading chats...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Chats</h1>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Add Contacts"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-full bg-gray-100 focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="overflow-y-auto flex-grow">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <p className="text-gray-500 mb-4">No chats found</p>
            <Button onClick={() => router.push('/contacts')}>
              Add Contacts
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredChats.map((chat) => (
              <li 
                key={chat.user.id} 
                onClick={() => navigateToChat(chat.user.id)}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${chat.user.firstName} ${chat.user.lastName}`} />
                    <AvatarFallback>
                      {getInitials(chat.user.firstName, chat.user.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-4 flex-grow">
                    <div className="flex justify-between">
                      <h3 className="text-sm font-medium">
                        {chat.user.firstName && chat.user.lastName 
                          ? `${chat.user.firstName} ${chat.user.lastName}` 
                          : chat.user.email}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {format(new Date(chat.lastMessage.createdAt), 'h:mm a')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <p className={`text-sm ${!chat.lastMessage.read && !chat.lastMessage.isFromCurrentUser ? 'font-semibold' : 'text-gray-500'}`}>
                        {chat.lastMessage.isFromCurrentUser ? 'You: ' : ''}
                        {getMessagePreview(chat.lastMessage.content)}
                      </p>
                      {!chat.lastMessage.read && !chat.lastMessage.isFromCurrentUser && (
                        <span className="bg-blue-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs">
                          1
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
} 