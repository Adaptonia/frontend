export interface User {
  $id: string
  userId: string
  name: string
  email: string
  profilePicture?: string
  role: 'admin' | 'user'
  userType?: 'student' | 'non-student' | null
  schoolName?: string
  hasCompletedUserTypeSelection?: boolean
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
  role: 'admin' | 'moderator' | 'member'
  joinedAt: string
  $createdAt: string
  $updatedAt: string
}

export interface ChannelMessage {
  $id: string
  channelId: string
  senderId: string
  content: string
  type: 'text' | 'image' | 'file'
  $createdAt: string
  $updatedAt: string
}

export interface MessageWithSender extends ChannelMessage {
  sender: User
}

export interface UserChannelInfo {
  channel: Channel
  member: {
    $id: string
    channelId: string
    userId: string
    role: 'admin' | 'moderator' | 'member'
    isActive: boolean
    lastActiveAt: string
    $createdAt: string
    $updatedAt: string
  }
  unreadCount: number
}

export interface CreateChannelData {
  name: string
  description: string
  type: 'public' | 'private'
  memberLimit?: number
}

export interface SendMessageData {
  content: string
  type?: 'text' | 'image' | 'file'
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  totalCount?: number
  hasMore?: boolean
}

export class ChannelError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ChannelError'
  }
}

export class NotFoundError extends ChannelError {
  constructor(resource: string) {
    super(`${resource} not found`)
    this.name = 'NotFoundError'
  }
}

export class PermissionError extends ChannelError {
  constructor(action: string) {
    super(`Permission denied: ${action}`)
    this.name = 'PermissionError'
  }
}

export class ValidationError extends ChannelError {
  constructor(message: string) {
    super(`Validation error: ${message}`)
    this.name = 'ValidationError'
  }
} 
