// User types
export interface User {
  $id: string;
  userId: string;
  email: string;
  name?: string;
  profilePicture?: string;
  role: 'user' | 'admin';
}

// Channel types
export interface Channel {
  $id: string;
  name: string;
  description?: string;
  type: 'PUBLIC' | 'PRIVATE';
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  memberCount: number;
}

export interface ChannelMember {
  $id: string;
  channelId: string;
  userId: string;
  role: 'admin' | 'member';
  joinedAt: string;
  isActive: boolean;
  lastReadMessageId?: string;
  lastActiveAt?: string;
}

export interface ChannelMessage {
  $id: string;
  channelId: string;
  senderId: string;
  content: string;
  replyToId?: string;
  createdAt: string;
  updateAt: string;
  isDeleted: boolean;
  readby: string[];
  messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'VOICE';
  attachments?: string;
  // Extended properties for UI
  sender?: User;
  replyToMessage?: ChannelMessage;
  reactions?: MessageReaction[];
}

export interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: string;
}

// Contact types
export interface Contact {
  $id: string;
  userId: string;
  contactId: string;
  createdAt: string;
  isBlocked: boolean;
  // Extended properties
  contactUser?: User | null;
  lastMessage?: DirectMessage;
  unreadCount?: number;
}

// Direct message types
export interface DirectMessage {
  $id: string;
  senderId: string;
  recipientId: string;
  content: string;
  replyToId?: string;
  createdAt: string;
  isRead: boolean;
  isDeleted: boolean;
  messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'VOICE';
  attachments?: string;
  // Extended properties for UI
  sender?: User;
  replyToMessage?: DirectMessage;
  reactions?: MessageReaction[];
}

// Real-time types
export interface TypingIndicator {
  userId: string;
  channelId?: string;
  recipientId?: string;
  isTyping: boolean;
  timestamp: string;
}

export interface OnlineStatus {
  userId: string;
  isOnline: boolean;
  lastSeen: string;
}

// UI State types
export interface ChatState {
  activeSection: 'CHATS' | 'CHANNELS';
  selectedContact?: Contact;
  selectedChannel?: Channel;
  isLoading: boolean;
  error?: string;
}

// API Request/Response types
export interface CreateChannelRequest {
  name: string;
  description?: string;
  type: 'PUBLIC' | 'PRIVATE';
}

export interface SendMessageRequest {
  content: string;
  replyToId?: string;
  messageType?: 'TEXT' | 'IMAGE' | 'FILE' | 'VOICE';
  attachments?: string;
}

export interface JoinChannelRequest {
  channelId: string;
}

export interface InviteContactRequest {
  phoneNumber: string;
  name?: string;
}

// Notification types
export interface MessageNotification {
  id: string;
  type: 'DIRECT_MESSAGE' | 'CHANNEL_MESSAGE';
  senderId: string;
  senderName: string;
  content: string;
  channelId?: string;
  channelName?: string;
  timestamp: string;
}

export interface UnreadCount {
  contactId?: string;
  channelId?: string;
  count: number;
}

// WebSocket message types
export interface WebSocketMessage {
  type: 'TYPING' | 'ONLINE_STATUS' | 'NEW_MESSAGE' | 'MESSAGE_READ' | 'REACTION';
  data: unknown;
}

export interface WebSocketTypingData {
  userId: string;
  channelId?: string;
  recipientId?: string;
  isTyping: boolean;
}

export interface WebSocketOnlineData {
  userId: string;
  isOnline: boolean;
}

export interface WebSocketMessageData {
  messageId: string;
  channelId?: string;
  recipientId?: string;
}

export interface WebSocketReactionData {
  messageId: string;
  userId: string;
  emoji: string;
  action: 'ADD' | 'REMOVE';
} 