import axios from 'axios';
import { apiClient } from './api-client';

export interface Message {
  id: string;
  content: string;
  senderId: string;
  channelId: string;
  createdAt: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface ChatPreview {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    isFromCurrentUser: boolean;
    read: boolean;
  };
}

export const chatApi = {
  // Get direct messages between the current user and another user
  getDirectMessages: async (otherUserId: string): Promise<Message[]> => {
    const response = await apiClient.get(`/chat/messages/${otherUserId}`);
    return response.data;
  },

  // Send a direct message to another user
  sendDirectMessage: async (receiverId: string, content: string): Promise<Message> => {
    const response = await apiClient.post('/chat/messages', { receiverId, content });
    return response.data;
  },

  // Mark messages from a specific user as read
  markMessagesAsRead: async (otherUserId: string): Promise<{ success: boolean }> => {
    const response = await apiClient.post(`/chat/messages/read/${otherUserId}`);
    return response.data;
  },

  // Get recent chats (conversations) for the current user
  getRecentChats: async (): Promise<ChatPreview[]> => {
    const response = await apiClient.get('/chat/recent');
    return response.data;
  }
}; 