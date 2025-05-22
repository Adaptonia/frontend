import { ID, Query } from 'appwrite';
import { client, databases, DATABASE_ID } from './client';

// Collection IDs - Make sure to add these to your .env file
export const CHANNELS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_CHANNELS_COLLECTION_ID || '';
export const CHANNEL_MEMBERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_CHANNEL_MEMBERS_COLLECTION_ID || '';
export const CHANNEL_MESSAGES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_CHANNEL_MESSAGES_COLLECTION_ID || '';
export const CHANNEL_INVITES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_CHANNEL_INVITES_COLLECTION_ID || '';

/**
 * Create a new channel
 */
export const createChannel = async (
  name: string,
  description: string,
  type: 'public' | 'private',
  creatorId: string,
) => {
  try {
    // Create the channel document
    const channel = await databases.createDocument(
      DATABASE_ID,
      CHANNELS_COLLECTION_ID,
      ID.unique(),
      {
        name,
        description,
        type,
        creatorId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
      }
    );

    // Add the creator as a member with admin role
    await addChannelMember(channel.$id, creatorId, 'admin');

    return {
      id: channel.$id,
      name: channel.name,
      description: channel.description,
      type: channel.type,
      creatorId: channel.creatorId,
      createdAt: channel.createdAt,
      updatedAt: channel.updatedAt,
      isActive: channel.isActive,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create channel';
    console.error('Channel creation error:', errorMessage);
    throw error;
  }
};

/**
 * Get all channels
 */
export const getChannels = async () => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      CHANNELS_COLLECTION_ID,
      [Query.equal('isActive', true)]
    );

    return response.documents.map(doc => ({
      id: doc.$id,
      name: doc.name,
      description: doc.description,
      type: doc.type,
      creatorId: doc.creatorId,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      isActive: doc.isActive,
      memberCount: doc.memberCount || 0,
    }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch channels';
    console.error('Channels fetching error:', errorMessage);
    throw error;
  }
};

/**
 * Get user's channels
 */
export const getUserChannels = async (userId: string) => {
  try {
    // Get channel memberships for this user
    const memberships = await databases.listDocuments(
      DATABASE_ID,
      CHANNEL_MEMBERS_COLLECTION_ID,
      [Query.equal('userId', userId), Query.equal('isActive', true)]
    );

    // If no memberships, return empty array
    if (memberships.documents.length === 0) {
      return [];
    }

    // Get the channel IDs
    const channelIds = memberships.documents.map(doc => doc.channelId);

    // Fetch the actual channels
    const response = await databases.listDocuments(
      DATABASE_ID,
      CHANNELS_COLLECTION_ID,
      [
        Query.equal('isActive', true),
        Query.equal('$id', channelIds)
      ]
    );

    return response.documents.map(doc => ({
      id: doc.$id,
      name: doc.name,
      description: doc.description,
      type: doc.type,
      creatorId: doc.creatorId,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      isActive: doc.isActive,
      memberCount: doc.memberCount || 0,
      // Get user's role in this channel from the membership
      role: memberships.documents.find(m => m.channelId === doc.$id)?.role || 'member',
    }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch user channels';
    console.error('User channels fetching error:', errorMessage);
    throw error;
  }
};

/**
 * Get channel by ID
 */
export const getChannelById = async (channelId: string) => {
  try {
    const channel = await databases.getDocument(
      DATABASE_ID,
      CHANNELS_COLLECTION_ID,
      channelId
    );

    return {
      id: channel.$id,
      name: channel.name,
      description: channel.description,
      type: channel.type,
      creatorId: channel.creatorId,
      createdAt: channel.createdAt,
      updatedAt: channel.updatedAt,
      isActive: channel.isActive,
      memberCount: channel.memberCount || 0,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch channel';
    console.error('Channel fetching error:', errorMessage);
    throw error;
  }
};

/**
 * Update channel
 */
export const updateChannel = async (
  channelId: string,
  data: {
    name?: string;
    description?: string;
    type?: 'public' | 'private';
  },
  userId: string
) => {
  try {
    // Check if user is an admin for this channel
    const membership = await getChannelMembership(channelId, userId);
    
    if (!membership || membership.role !== 'admin') {
      throw new Error('You do not have permission to update this channel');
    }

    const response = await databases.updateDocument(
      DATABASE_ID,
      CHANNELS_COLLECTION_ID,
      channelId,
      {
        ...data,
        updatedAt: new Date().toISOString(),
      }
    );

    return {
      id: response.$id,
      name: response.name,
      description: response.description,
      type: response.type,
      creatorId: response.creatorId,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
      isActive: response.isActive,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update channel';
    console.error('Channel update error:', errorMessage);
    throw error;
  }
};

/**
 * Delete channel (soft delete)
 */
export const deleteChannel = async (channelId: string, userId: string) => {
  try {
    // Check if user is an admin for this channel
    const membership = await getChannelMembership(channelId, userId);
    
    if (!membership || membership.role !== 'admin') {
      throw new Error('You do not have permission to delete this channel');
    }

    await databases.updateDocument(
      DATABASE_ID,
      CHANNELS_COLLECTION_ID,
      channelId,
      {
        isActive: false,
        updatedAt: new Date().toISOString(),
      }
    );

    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete channel';
    console.error('Channel deletion error:', errorMessage);
    throw error;
  }
};

/**
 * Add member to channel
 */
export const addChannelMember = async (
  channelId: string,
  userId: string,
  role: 'admin' | 'member' = 'member'
) => {
  try {
    const response = await databases.createDocument(
      DATABASE_ID,
      CHANNEL_MEMBERS_COLLECTION_ID,
      ID.unique(),
      {
        channelId,
        userId,
        role,
        joinedAt: new Date().toISOString(),
        isActive: true,
      }
    );

    // Increment member count in the channel
    const channel = await databases.getDocument(
      DATABASE_ID,
      CHANNELS_COLLECTION_ID,
      channelId
    );

    await databases.updateDocument(
      DATABASE_ID,
      CHANNELS_COLLECTION_ID,
      channelId,
      {
        memberCount: (channel.memberCount || 0) + 1,
        updatedAt: new Date().toISOString(),
      }
    );

    return {
      id: response.$id,
      channelId: response.channelId,
      userId: response.userId,
      role: response.role,
      joinedAt: response.joinedAt,
      isActive: response.isActive,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to add member to channel';
    console.error('Channel member addition error:', errorMessage);
    throw error;
  }
};

/**
 * Get channel membership for a user
 */
export const getChannelMembership = async (channelId: string, userId: string) => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      CHANNEL_MEMBERS_COLLECTION_ID,
      [
        Query.equal('channelId', channelId),
        Query.equal('userId', userId),
        Query.equal('isActive', true)
      ]
    );

    if (response.documents.length === 0) {
      return null;
    }

    const membership = response.documents[0];

    return {
      id: membership.$id,
      channelId: membership.channelId,
      userId: membership.userId,
      role: membership.role,
      joinedAt: membership.joinedAt,
      isActive: membership.isActive,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get channel membership';
    console.error('Channel membership fetching error:', errorMessage);
    throw error;
  }
};

/**
 * Remove member from channel
 */
export const removeChannelMember = async (
  channelId: string,
  userIdToRemove: string,
  requestingUserId: string
) => {
  try {
    // Check if requesting user is an admin or the user being removed
    const requesterMembership = await getChannelMembership(channelId, requestingUserId);
    
    if (!requesterMembership) {
      throw new Error('You are not a member of this channel');
    }

    if (requesterMembership.role !== 'admin' && requestingUserId !== userIdToRemove) {
      throw new Error('You do not have permission to remove this member');
    }

    // Find the membership document
    const membershipsResponse = await databases.listDocuments(
      DATABASE_ID,
      CHANNEL_MEMBERS_COLLECTION_ID,
      [
        Query.equal('channelId', channelId),
        Query.equal('userId', userIdToRemove),
        Query.equal('isActive', true)
      ]
    );

    if (membershipsResponse.documents.length === 0) {
      throw new Error('User is not a member of this channel');
    }

    const membershipId = membershipsResponse.documents[0].$id;

    // Soft delete the membership
    await databases.updateDocument(
      DATABASE_ID,
      CHANNEL_MEMBERS_COLLECTION_ID,
      membershipId,
      {
        isActive: false,
        leftAt: new Date().toISOString(),
      }
    );

    // Decrement member count in the channel
    const channel = await databases.getDocument(
      DATABASE_ID,
      CHANNELS_COLLECTION_ID,
      channelId
    );

    await databases.updateDocument(
      DATABASE_ID,
      CHANNELS_COLLECTION_ID,
      channelId,
      {
        memberCount: Math.max((channel.memberCount || 0) - 1, 0),
        updatedAt: new Date().toISOString(),
      }
    );

    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to remove member from channel';
    console.error('Channel member removal error:', errorMessage);
    throw error;
  }
};

/**
 * Get channel members
 */
export const getChannelMembers = async (channelId: string) => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      CHANNEL_MEMBERS_COLLECTION_ID,
      [
        Query.equal('channelId', channelId),
        Query.equal('isActive', true)
      ]
    );

    return response.documents.map(doc => ({
      id: doc.$id,
      channelId: doc.channelId,
      userId: doc.userId,
      role: doc.role,
      joinedAt: doc.joinedAt,
      isActive: doc.isActive,
    }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get channel members';
    console.error('Channel members fetching error:', errorMessage);
    throw error;
  }
};

/**
 * Create invite link
 */
export const createChannelInvite = async (channelId: string, userId: string, expiresInHours: number = 24) => {
  try {
    // Check if user is a member of this channel
    const membership = await getChannelMembership(channelId, userId);
    
    if (!membership) {
      throw new Error('You are not a member of this channel');
    }

    // Generate a unique invite code
    const inviteCode = ID.unique();
    
    // Calculate expiration time
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    // Create invite document
    const invite = await databases.createDocument(
      DATABASE_ID,
      'channel_invites', // Add this collection ID to .env
      inviteCode,
      {
        channelId,
        createdBy: userId,
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
        isActive: true,
      }
    );

    return {
      inviteCode: invite.$id,
      channelId: invite.channelId,
      createdBy: invite.createdBy,
      createdAt: invite.createdAt,
      expiresAt: invite.expiresAt,
      isActive: invite.isActive,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create invite';
    console.error('Channel invite creation error:', errorMessage);
    throw error;
  }
};

/**
 * Join channel via invite code
 */
export const joinChannelViaInvite = async (inviteCode: string, userId: string) => {
  try {
    // Verify invite code
    const invite = await databases.getDocument(
      DATABASE_ID,
      'channel_invites', // Add this collection ID to .env
      inviteCode
    );

    // Check if invite is valid
    if (!invite.isActive) {
      throw new Error('This invite has been deactivated');
    }

    // Check if invite is expired
    if (new Date(invite.expiresAt) < new Date()) {
      throw new Error('This invite has expired');
    }

    // Check if user is already a member
    const existingMembership = await getChannelMembership(invite.channelId, userId);
    
    if (existingMembership) {
      throw new Error('You are already a member of this channel');
    }

    // Add user to channel
    await addChannelMember(invite.channelId, userId, 'member');

    // Get channel info to return
    const channel = await getChannelById(invite.channelId);

    return {
      message: 'Successfully joined channel',
      channelId: invite.channelId,
      channelName: channel.name,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to join channel';
    console.error('Channel join error:', errorMessage);
    throw error;
  }
};

/**
 * Send message to channel
 */
export const sendChannelMessage = async (
  channelId: string,
  userId: string,
  content: string,
  replyToId?: string
) => {
  try {
    // Check if user is a member of this channel
    const membership = await getChannelMembership(channelId, userId);
    
    if (!membership) {
      throw new Error('You are not a member of this channel');
    }

    const message = await databases.createDocument(
      DATABASE_ID,
      CHANNEL_MESSAGES_COLLECTION_ID,
      ID.unique(),
      {
        channelId,
        senderId: userId,
        content,
        replyToId: replyToId || null,
        createdAt: new Date().toISOString(),
        updateAt: new Date().toISOString(),
        isDeleted: false,
      }
    );

    return {
      id: message.$id,
      channelId: message.channelId,
      senderId: message.senderId,
      content: message.content,
      replyToId: message.replyToId,
      createdAt: message.createdAt,
      updatedAt: message.updateAt,
      isDeleted: message.isDeleted,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
    console.error('Channel message sending error:', errorMessage);
    throw error;
  }
};

/**
 * Get channel messages
 */
export const getChannelMessages = async (
  channelId: string,
  userId: string,
  limit: number = 50,
  offset: number = 0
) => {
  try {
    // Check if user is a member of this channel
    const membership = await getChannelMembership(channelId, userId);
    
    if (!membership) {
      throw new Error('You are not a member of this channel');
    }

    const response = await databases.listDocuments(
      DATABASE_ID,
      CHANNEL_MESSAGES_COLLECTION_ID,
      [
        Query.equal('channelId', channelId),
        Query.equal('isDeleted', false),
        Query.orderDesc('createdAt'),
        Query.limit(limit),
        Query.offset(offset)
      ]
    );

    return response.documents.map(doc => ({
      id: doc.$id,
      channelId: doc.channelId,
      senderId: doc.senderId,
      content: doc.content,
      replyToId: doc.replyToId,
      createdAt: doc.createdAt,
      updatedAt: doc.updateAt,
      isDeleted: doc.isDeleted,
    }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get channel messages';
    console.error('Channel messages fetching error:', errorMessage);
    throw error;
  }
};

/**
 * Delete channel message
 */
export const deleteChannelMessage = async (
  messageId: string, 
  userId: string
) => {
  try {
    // Get the message
    const message = await databases.getDocument(
      DATABASE_ID,
      CHANNEL_MESSAGES_COLLECTION_ID,
      messageId
    );

    // Check if user is the sender of this message
    if (message.senderId !== userId) {
      // If not sender, check if user is a channel admin
      const membership = await getChannelMembership(message.channelId, userId);
      
      if (!membership || membership.role !== 'ADMIN') {
        throw new Error('You do not have permission to delete this message');
      }
    }

    // Soft delete the message
    await databases.updateDocument(
      DATABASE_ID,
      CHANNEL_MESSAGES_COLLECTION_ID,
      messageId,
      {
        isDeleted: true,
        updateAt: new Date().toISOString(),
      }
    );

    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete message';
    console.error('Channel message deletion error:', errorMessage);
    throw error;
  }
}; 