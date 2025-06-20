import { Client, Databases, Query, ID, AppwriteException } from 'appwrite'
import {
  User,
  Channel,
  ChannelMember,
  ChannelMessage,
  CreateChannelData,
  SendMessageData,
  MessageWithSender,
  UserChannelInfo,
  ApiResponse,
  PaginatedResponse,
  ChannelError,
  NotFoundError,
  PermissionError,
  ValidationError
} from '../types/channel'

// Initialize Appwrite client
const client = new Client()
client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')

const databases = new Databases(client)

// Database and Collection IDs (should be environment variables)
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'main'
const COLLECTIONS = {
  USERS: process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID || 'users',
  CHANNELS: process.env.NEXT_PUBLIC_APPWRITE_CHANNELS_COLLECTION_ID || 'channels',
  CHANNEL_MEMBERS: process.env.NEXT_PUBLIC_APPWRITE_CHANNEL_MEMBERS_COLLECTION_ID || 'channel-members',
  CHANNEL_MESSAGES: process.env.NEXT_PUBLIC_APPWRITE_CHANNEL_MESSAGES_COLLECTION_ID || 'channel-messages'
}

class ChannelService {
  /**
   * Create a new channel and add creator as admin member
   */
  async createChannel(channelData: CreateChannelData, userId: string): Promise<ApiResponse<Channel>> {
    try {
      // Validate input
      if (!channelData.name.trim()) {
        throw new ValidationError('Channel name is required')
      }

      if (channelData.name.length < 3 || channelData.name.length > 50) {
        throw new ValidationError('Channel name must be between 3 and 50 characters')
      }

      // Check if user exists and has permission to create channels
      const user = await this.checkUserRole(userId)
      if (!user.success || !user.data) {
        throw new NotFoundError('User')
      }

      // Create channel document
      const channelDoc = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.CHANNELS,
        ID.unique(),
        {
          name: channelData.name.trim(),
          description: channelData.description.trim(),
          type: channelData.type,
          creatorId: userId,
          memberCount: 1,
          isActive: true
        }
      )

      // Add creator as admin member
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.CHANNEL_MEMBERS,
        ID.unique(),
        {
          channelId: channelDoc.$id,
          userId: userId,
          role: 'admin',
          isActive: true,
          lastActiveAt: new Date().toISOString()
        }
      )

      return {
        success: true,
        data: channelDoc as unknown as Channel
      }
    } catch (error) {
      console.error('Error creating channel:', error)
      return this.handleError(error)
    }
  }

  /**
   * Get all public channels with member counts
   */
  async getPublicChannels(): Promise<ApiResponse<PaginatedResponse<Channel>>> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.CHANNELS,
        [
          Query.equal('type', 'public'),
          Query.equal('isActive', true),
          Query.orderDesc('$createdAt'),
          Query.limit(100)
        ]
      )

      return {
        success: true,
        data: {
          documents: response.documents as unknown as Channel[],
          total: response.total,
          hasMore: response.documents.length === 100
        }
      }
    } catch (error) {
      console.error('Error fetching public channels:', error)
      return this.handleError(error)
    }
  }

  /**
   * Get channels user is a member of
   */
  async getUserChannels(userId: string): Promise<ApiResponse<UserChannelInfo[]>> {
    try {
      // Get user's channel memberships
      const memberships = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.CHANNEL_MEMBERS,
        [
          Query.equal('userId', userId),
          Query.equal('isActive', true),
          Query.orderDesc('lastActiveAt')
        ]
      )

      if (memberships.documents.length === 0) {
        return {
          success: true,
          data: []
        }
      }

      // Get channel details for each membership
      const channelIds = memberships.documents.map(m => (m as unknown as ChannelMember).channelId)
      const channels = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.CHANNELS,
        [
          Query.equal('$id', channelIds),
          Query.equal('isActive', true)
        ]
      )

      // Combine channel and member data
      const userChannels: UserChannelInfo[] = memberships.documents.map(member => {
        const memberData = member as unknown as ChannelMember
        const channelData = channels.documents.find(c => c.$id === memberData.channelId) as unknown as Channel
        
        return {
          channel: channelData,
          member: memberData,
          unreadCount: 0 // TODO: Calculate unread count based on lastReadMessageId
        }
      }).filter(uc => uc.channel) // Filter out channels that weren't found

      return {
        success: true,
        data: userChannels
      }
    } catch (error) {
      console.error('Error fetching user channels:', error)
      return this.handleError(error)
    }
  }

  /**
   * Add user to channel as member
   */
  async joinChannel(channelId: string, userId: string): Promise<ApiResponse<ChannelMember>> {
    try {
      // Check if channel exists
      const channel = await databases.getDocument(DATABASE_ID, COLLECTIONS.CHANNELS, channelId)
      if (!channel || !channel.isActive) {
        throw new NotFoundError('Channel')
      }

      // Check if user is already a member
      const existingMember = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.CHANNEL_MEMBERS,
        [
          Query.equal('channelId', channelId),
          Query.equal('userId', userId),
          Query.equal('isActive', true)
        ]
      )

      if (existingMember.documents.length > 0) {
        return {
          success: true,
          data: existingMember.documents[0] as unknown as ChannelMember
        }
      }

      // Add user as member
      const memberDoc = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.CHANNEL_MEMBERS,
        ID.unique(),
        {
          channelId,
          userId,
          role: 'member',
          isActive: true,
          lastActiveAt: new Date().toISOString()
        }
      )

      // Update channel member count
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.CHANNELS,
        channelId,
        {
          memberCount: (channel as unknown as Channel).memberCount + 1
        }
      )

      return {
        success: true,
        data: memberDoc as unknown as ChannelMember
      }
    } catch (error) {
      console.error('Error joining channel:', error)
      return this.handleError(error)
    }
  }

  /**
   * Remove user from channel
   */
  async leaveChannel(channelId: string, userId: string): Promise<ApiResponse<boolean>> {
    try {
      // Find user's membership
      const membership = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.CHANNEL_MEMBERS,
        [
          Query.equal('channelId', channelId),
          Query.equal('userId', userId),
          Query.equal('isActive', true)
        ]
      )

      if (membership.documents.length === 0) {
        throw new NotFoundError('Channel membership')
      }

      const memberDoc = membership.documents[0] as unknown as ChannelMember

      // Check if user is the channel creator/admin
      const channel = await databases.getDocument(DATABASE_ID, COLLECTIONS.CHANNELS, channelId) as unknown as Channel
      if (channel.creatorId === userId) {
        throw new PermissionError('Channel creator cannot leave the channel')
      }

      // Deactivate membership
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.CHANNEL_MEMBERS,
        memberDoc.$id,
        {
          isActive: false
        }
      )

      // Update channel member count
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.CHANNELS,
        channelId,
        {
          memberCount: Math.max(0, (channel as unknown as Channel).memberCount - 1)
        }
      )

      return {
        success: true,
        data: true
      }
    } catch (error) {
      console.error('Error leaving channel:', error)
      return this.handleError(error)
    }
  }

  /**
   * Get user role from users collection
   */
  async checkUserRole(userId: string): Promise<ApiResponse<User>> {
    try {
      const user = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.USERS,
        [
          Query.equal('userId', userId),
          Query.limit(1)
        ]
      )

      if (user.documents.length === 0) {
        throw new NotFoundError('User')
      }

      return {
        success: true,
        data: user.documents[0] as unknown as User
      }
    } catch (error) {
      console.error('Error checking user role:', error)
      return this.handleError(error)
    }
  }

  /**
   * Get recent messages from a channel
   */
  async getChannelMessages(channelId: string, limit: number = 50): Promise<ApiResponse<MessageWithSender[]>> {
    try {
      // Get messages
      const messages = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.CHANNEL_MESSAGES,
        [
          Query.equal('channelId', channelId),
          Query.equal('isDeleted', false),
          Query.orderDesc('$createdAt'),
          Query.limit(limit)
        ]
      )

      if (messages.documents.length === 0) {
        return {
          success: true,
          data: []
        }
      }

      // Get unique sender IDs
      const senderIds = [...new Set(messages.documents.map(m => (m as unknown as ChannelMessage).senderId))]
      
      // Get sender information
      const users = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.USERS,
        [
          Query.equal('userId', senderIds)
        ]
      )

      // Combine messages with sender data
      const messagesWithSenders: MessageWithSender[] = messages.documents.map(message => {
        const messageData = message as unknown as ChannelMessage
        const sender = users.documents.find(u => (u as unknown as User).userId === messageData.senderId) as unknown as User

        return {
          $id: messageData.$id,
          channelId: messageData.channelId,
          senderId: messageData.senderId,
          content: messageData.content,
          replyToId: messageData.replyToId,
          messageType: messageData.messageType,
          $createdAt: messageData.$createdAt,
          $updatedAt: messageData.$updatedAt,
          sender
        }
      }).reverse() // Reverse to show oldest first

      return {
        success: true,
        data: messagesWithSenders
      }
    } catch (error) {
      console.error('Error fetching channel messages:', error)
      return this.handleError(error)
    }
  }

  /**
   * Send a new message to a channel
   */
  async sendMessage(channelId: string, userId: string, messageData: SendMessageData): Promise<ApiResponse<MessageWithSender>> {
    try {
      // Validate message content
      if (!messageData.content.trim()) {
        throw new ValidationError('Message content cannot be empty')
      }

      // Check if user is a member of the channel
      const membership = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.CHANNEL_MEMBERS,
        [
          Query.equal('channelId', channelId),
          Query.equal('userId', userId),
          Query.equal('isActive', true)
        ]
      )

      if (membership.documents.length === 0) {
        throw new PermissionError('User is not a member of this channel')
      }

      // Create message
      const messageDoc = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.CHANNEL_MESSAGES,
        ID.unique(),
        {
          channelId,
          senderId: userId,
          content: messageData.content.trim(),
          replyToId: messageData.replyToId || null,
          messageType: messageData.messageType || 'text',
          isDeleted: false,
          readby: [userId],
          attachments: messageData.attachments || null
        }
      )

      // Get sender information
      const userResponse = await this.checkUserRole(userId)
      if (!userResponse.success || !userResponse.data) {
        throw new NotFoundError('User')
      }

      const messageWithSender: MessageWithSender = {
        $id: messageDoc.$id,
        channelId: messageDoc.channelId as string,
        senderId: messageDoc.senderId as string,
        content: messageDoc.content as string,
        replyToId: messageDoc.replyToId as string | undefined,
        messageType: messageDoc.messageType as 'text' | 'image' | 'file' | 'meet-card',
        $createdAt: messageDoc.$createdAt,
        $updatedAt: messageDoc.$updatedAt,
        sender: userResponse.data
      }

      return {
        success: true,
        data: messageWithSender
      }
    } catch (error: unknown) {
      console.error('Error sending message:', error)
      return this.handleError(error)
    }
  }

  /**
   * Handle errors and convert to consistent response format
   */
  private handleError(error: unknown): ApiResponse<any> {
    if (error instanceof ChannelError) {
      return {
        success: false,
        error: error.message
      }
    }

    if (error instanceof AppwriteException) {
      return {
        success: false,
        error: error.message || 'An error occurred with the database'
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

// Export singleton instance
export const channelService = new ChannelService()
export default channelService 
