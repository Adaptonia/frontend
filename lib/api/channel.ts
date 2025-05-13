import { apiClient } from './api-client';
import { Message } from './chat';

export type ChannelType = 'GROUP' | 'DISCUSSION' | 'SUPPORT' | 'ANNOUNCEMENTS';
export type ChannelRole = 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER';

export interface Channel {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  type: ChannelType;
  isPublic: boolean;
  role?: ChannelRole; // Only included when getting user's channels
  createdAt: string;
  updatedAt: string;
  memberCount?: number; // Only included for public channels listing
}

export interface ChannelMember {
  id: string;
  userId: string;
  channelId: string;
  role: ChannelRole;
  joinedAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface CreateChannelData {
  name: string;
  description?: string;
  icon?: string;
  type?: ChannelType;
  isPublic?: boolean;
}

export class InsufficientPermissionsError extends Error {
  constructor(message = 'You do not have sufficient permissions to perform this action') {
    super(message);
    this.name = 'InsufficientPermissionsError';
  }
}

export const channelApi = {
  // Create a new channel
  createChannel: async (data: CreateChannelData): Promise<Channel> => {
    try {
      const response = await apiClient.post('/channels', data);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error && 
          'response' in error && 
          error.response && 
          typeof error.response === 'object' && 
          'status' in error.response && 
          error.response.status === 403) {
        throw new InsufficientPermissionsError('Only administrators can create channels');
      }
      throw error;
    }
  },

  // Get all channels for the current user
  getUserChannels: async (): Promise<Channel[]> => {
    const response = await apiClient.get('/channels');
    return response.data;
  },

  // Get all public channels
  getPublicChannels: async (): Promise<Channel[]> => {
    const response = await apiClient.get('/channels/public');
    return response.data;
  },

  // Get a channel by ID
  getChannelById: async (channelId: string): Promise<Channel> => {
    const response = await apiClient.get(`/channels/${channelId}`);
    return response.data;
  },

  // Update channel information
  updateChannelInfo: async (channelId: string, data: Partial<CreateChannelData>): Promise<Channel> => {
    const response = await apiClient.patch(`/channels/${channelId}`, data);
    return response.data;
  },

  // Add a member to a channel
  addChannelMember: async (channelId: string, userId: string, role?: ChannelRole): Promise<ChannelMember> => {
    const response = await apiClient.post(`/channels/${channelId}/members`, { userId, role });
    return response.data;
  },

  // Remove a member from a channel
  removeChannelMember: async (channelId: string, memberId: string): Promise<{ success: boolean }> => {
    const response = await apiClient.delete(`/channels/${channelId}/members/${memberId}`);
    return response.data;
  },

  // Get all messages in a channel
  getChannelMessages: async (channelId: string): Promise<Message[]> => {
    const response = await apiClient.get(`/channels/${channelId}/messages`);
    return response.data;
  },

  // Send a message to a channel
  sendChannelMessage: async (channelId: string, content: string): Promise<Message> => {
    const response = await apiClient.post(`/channels/${channelId}/messages`, { content });
    return response.data;
  },

  // Join a public channel
  joinChannel: async (channelId: string): Promise<ChannelMember> => {
    try {
      console.log(`Attempting to join channel: ${channelId}`);
      const response = await apiClient.post('/channels/join-channel', { channelId });
      console.log('Join successful!', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Failed to join channel:', error);
      // Check for specific error responses
      if (error.response && error.response.data) {
        console.error('Error details:', error.response.data);
      }
      throw new Error('Unable to join channel. Please try again later.');
    }
  },

  // Add to channelApi object
generateInviteCode: async (channelId: string): Promise<string> => {
  const response = await apiClient.get(`/channels/${channelId}/invite`);
  return response.data.inviteCode
},

joinByInviteCode: async (inviteCode: string): Promise<ChannelMember> => {
  const response = await apiClient.post('/channels/join-by-invite', { inviteCode });
  return response.data;
}
}; 