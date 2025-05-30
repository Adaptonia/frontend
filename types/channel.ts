export interface User {
  $id: string
  userId: string
  name: string
  email: string
  profilePicture?: string
  role: 'admin' | 'user'
  $createdAt: string
  $updatedAt: string
}

export interface Channel {
  $id: string
  name: string
  description: string
  type: 'public' | 'private'
  creatorId: string
  memberCount: number
  isActive: boolean
  $createdAt: string
  $updatedAt: string
}

export interface ChannelMember {
  $id: string
  channelId: string
  userId: string
  role: 'admin' | 'member'
  isActive: boolean
  lastReadMessageId?: string
  lastActiveAt: string
  $createdAt: string
  $updatedAt: string
}

export interface ChannelMessage {
  $id: string
  channelId: string
  senderId: string
  content: string
  replyToId?: string
  isDeleted: boolean
  readby: string[]
  messageType: 'text' | 'image' | 'file' | 'meet-card'
  attachments?: string
  $createdAt: string
  $updatedAt: string
}

export interface UserChannelInfo {
  channel: Channel
  member: ChannelMember
  unreadCount: number
}

export interface MessageWithSender {
  $id: string
  channelId: string
  senderId: string
  content: string
  replyToId?: string
  messageType: 'text' | 'image' | 'file' | 'meet-card'
  $createdAt: string
  $updatedAt: string
  sender: User
}

export interface CreateChannelData {
  name: string
  description: string
  type: 'public' | 'private'
}

export interface SendMessageData {
  content: string
  messageType?: 'text' | 'image' | 'file' | 'meet-card'
  replyToId?: string
  attachments?: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

export interface PaginatedResponse<T = any> {
  documents: T[]
  total: number
  hasMore?: boolean
}

export class ChannelError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'ChannelError'
  }
}

export class ValidationError extends ChannelError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR', 400)
    this.name = 'ValidationError'
  }
}

export class PermissionError extends ChannelError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'PERMISSION_ERROR', 403)
    this.name = 'PermissionError'
  }
}

export class NotFoundError extends ChannelError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404)
    this.name = 'NotFoundError'
  }
} 