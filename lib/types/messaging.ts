// Channel types
export type ChannelType = 'public' | 'private';
export type ChannelMemberRole = 'admin' | 'member';

export interface Channel {
  id: string;
  name: string;
  description?: string;
  type: ChannelType;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  memberCount?: number;
}

export interface ChannelMember {
  id: string;
  channelId: string;
  userId: string;
  role: ChannelMemberRole;
  joinedAt: string;
  isActive: boolean;
  leftAt?: string;
}

export interface ChannelMessage {
  id: string;
  channelId: string;
  senderId: string;
  content: string;
  replyToId?: string | null;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  // Added sender info for display purposes
  sender?: {
    firstName?: string;
    lastName?: string;
    email: string;
  };
}

export interface ChannelInvite {
  inviteCode: string;
  channelId: string;
  createdBy: string;
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
}

// Direct messaging types
export interface Contact {
  id: string;
  userId: string;
  contactId: string;
  createdAt: string;
  isBlocked: boolean;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  replyToId?: string | null;
  createdAt: string;
  isRead: boolean;
  isDeleted: boolean;
}

export interface Conversation {
  userId: string;
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    isRead: boolean;
    senderId: string;
  };
  unreadCount: number;
}

// WebSocket types
export interface WebSocketMessage {
  type: string;
  data: unknown;
}

export interface TypingIndicator {
  channelId: string;
  userId: string;
  isTyping: boolean;
}

// Request types
export interface CreateChannelRequest {
  name: string;
  description?: string;
  type: ChannelType;
}

export interface UpdateChannelRequest {
  name?: string;
  description?: string;
  type?: ChannelType;
}

export interface JoinChannelRequest {
  inviteCode: string;
}

export interface CreateInviteRequest {
  channelId: string;
  expiresInHours?: number;
}

export interface SendMessageRequest {
  content: string;
  replyToId?: string;
}

// Response types
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
} 