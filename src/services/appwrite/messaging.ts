import { ID, Query } from 'appwrite';
import { client, databases, DATABASE_ID } from './client';

// Collection IDs - Make sure to add these to your .env file
export const CONTACTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_CONTACTS_COLLECTION_ID || '';
export const DIRECT_MESSAGES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_DIRECT_MESSAGES_COLLECTION_ID || '';
export const CHANNEL_INVITES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_CHANNEL_INVITES_COLLECTION_ID || '';

/**
 * Add a contact
 */
export const addContact = async (userId: string, contactId: string) => {
  try {
    // Check if contact already exists
    const existingContacts = await databases.listDocuments(
      DATABASE_ID,
      CONTACTS_COLLECTION_ID,
      [
        Query.equal('userId', userId),
        Query.equal('contactId', contactId)
      ]
    );

    if (existingContacts.documents.length > 0) {
      throw new Error('This user is already in your contacts');
    }

    // Create contact entry
    const contact = await databases.createDocument(
      DATABASE_ID,
      CONTACTS_COLLECTION_ID,
      ID.unique(),
      {
        userId,
        contactId,
        createdAt: new Date().toISOString(),
        isBlocked: false,
      }
    );

    return {
      id: contact.$id,
      userId: contact.userId,
      contactId: contact.contactId,
      createdAt: contact.createdAt,
      isBlocked: contact.isBlocked,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to add contact';
    console.error('Contact addition error:', errorMessage);
    throw error;
  }
};

/**
 * Get user contacts
 */
export const getUserContacts = async (userId: string) => {
  try {
    const contacts = await databases.listDocuments(
      DATABASE_ID,
      CONTACTS_COLLECTION_ID,
      [
        Query.equal('userId', userId),
        Query.equal('isBlocked', false)
      ]
    );

    return contacts.documents.map(doc => ({
      id: doc.$id,
      userId: doc.userId,
      contactId: doc.contactId,
      createdAt: doc.createdAt,
      isBlocked: doc.isBlocked,
    }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get contacts';
    console.error('Contacts fetching error:', errorMessage);
    throw error;
  }
};

/**
 * Block a contact
 */
export const blockContact = async (userId: string, contactId: string) => {
  try {
    // Find contact entry
    const contacts = await databases.listDocuments(
      DATABASE_ID,
      CONTACTS_COLLECTION_ID,
      [
        Query.equal('userId', userId),
        Query.equal('contactId', contactId)
      ]
    );

    if (contacts.documents.length === 0) {
      // Create a new blocked contact entry
      const contact = await databases.createDocument(
        DATABASE_ID,
        CONTACTS_COLLECTION_ID,
        ID.unique(),
        {
          userId,
          contactId,
          createdAt: new Date().toISOString(),
          isBlocked: true,
        }
      );

      return {
        id: contact.$id,
        userId: contact.userId,
        contactId: contact.contactId,
        createdAt: contact.createdAt,
        isBlocked: contact.isBlocked,
      };
    }

    // Update existing contact
    const contactDocId = contacts.documents[0].$id;
    const contact = await databases.updateDocument(
      DATABASE_ID,
      CONTACTS_COLLECTION_ID,
      contactDocId,
      {
        isBlocked: true,
      }
    );

    return {
      id: contact.$id,
      userId: contact.userId,
      contactId: contact.contactId,
      createdAt: contact.createdAt,
      isBlocked: contact.isBlocked,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to block contact';
    console.error('Contact blocking error:', errorMessage);
    throw error;
  }
};

/**
 * Unblock a contact
 */
export const unblockContact = async (userId: string, contactId: string) => {
  try {
    // Find contact entry
    const contacts = await databases.listDocuments(
      DATABASE_ID,
      CONTACTS_COLLECTION_ID,
      [
        Query.equal('userId', userId),
        Query.equal('contactId', contactId),
        Query.equal('isBlocked', true)
      ]
    );

    if (contacts.documents.length === 0) {
      throw new Error('This contact is not blocked');
    }

    // Update contact
    const contactDocId = contacts.documents[0].$id;
    const contact = await databases.updateDocument(
      DATABASE_ID,
      CONTACTS_COLLECTION_ID,
      contactDocId,
      {
        isBlocked: false,
      }
    );

    return {
      id: contact.$id,
      userId: contact.userId,
      contactId: contact.contactId,
      createdAt: contact.createdAt,
      isBlocked: contact.isBlocked,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to unblock contact';
    console.error('Contact unblocking error:', errorMessage);
    throw error;
  }
};

/**
 * Remove a contact
 */
export const removeContact = async (userId: string, contactId: string) => {
  try {
    // Find contact entry
    const contacts = await databases.listDocuments(
      DATABASE_ID,
      CONTACTS_COLLECTION_ID,
      [
        Query.equal('userId', userId),
        Query.equal('contactId', contactId)
      ]
    );

    if (contacts.documents.length === 0) {
      throw new Error('This user is not in your contacts');
    }

    // Delete contact
    const contactDocId = contacts.documents[0].$id;
    await databases.deleteDocument(
      DATABASE_ID,
      CONTACTS_COLLECTION_ID,
      contactDocId
    );

    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to remove contact';
    console.error('Contact removal error:', errorMessage);
    throw error;
  }
};

/**
 * Send direct message
 */
export const sendDirectMessage = async (
  senderId: string,
  recipientId: string,
  content: string,
  replyToId?: string
) => {
  try {
    // Check if recipient has blocked sender
    const blockedContacts = await databases.listDocuments(
      DATABASE_ID,
      CONTACTS_COLLECTION_ID,
      [
        Query.equal('userId', recipientId),
        Query.equal('contactId', senderId),
        Query.equal('isBlocked', true)
      ]
    );

    if (blockedContacts.documents.length > 0) {
      throw new Error('You cannot send messages to this user');
    }

    // Create message
    const message = await databases.createDocument(
      DATABASE_ID,
      DIRECT_MESSAGES_COLLECTION_ID,
      ID.unique(),
      {
        senderId,
        recipientId,
        content,
        replyToId: replyToId || null,
        createdAt: new Date().toISOString(),
        isRead: false,
        isDeleted: false,
      }
    );

    return {
      id: message.$id,
      senderId: message.senderId,
      recipientId: message.recipientId,
      content: message.content,
      replyToId: message.replyToId,
      createdAt: message.createdAt,
      isRead: message.isRead,
      isDeleted: message.isDeleted,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
    console.error('Direct message sending error:', errorMessage);
    throw error;
  }
};

/**
 * Get conversation messages between two users
 */
export const getConversation = async (
  userId1: string,
  userId2: string,
  limit: number = 50,
  offset: number = 0
) => {
  try {
    // Get messages where either user is sender and the other is recipient
    const messagesQuery1 = [
      Query.equal('senderId', userId1),
      Query.equal('recipientId', userId2),
      Query.equal('isDeleted', false)
    ];

    const messagesQuery2 = [
      Query.equal('senderId', userId2),
      Query.equal('recipientId', userId1),
      Query.equal('isDeleted', false)
    ];

    // First get messages where user1 is sender
    const messages1 = await databases.listDocuments(
      DATABASE_ID,
      DIRECT_MESSAGES_COLLECTION_ID,
      messagesQuery1
    );

    // Then get messages where user2 is sender
    const messages2 = await databases.listDocuments(
      DATABASE_ID,
      DIRECT_MESSAGES_COLLECTION_ID,
      messagesQuery2
    );

    // Combine both result sets
    const allMessages = [
      ...messages1.documents,
      ...messages2.documents
    ];

    // Sort by creation date
    allMessages.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // Apply pagination
    const paginatedMessages = allMessages.slice(offset, offset + limit);

    return paginatedMessages.map(doc => ({
      id: doc.$id,
      senderId: doc.senderId,
      recipientId: doc.recipientId,
      content: doc.content,
      replyToId: doc.replyToId,
      createdAt: doc.createdAt,
      isRead: doc.isRead,
      isDeleted: doc.isDeleted,
    }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get conversation';
    console.error('Conversation fetching error:', errorMessage);
    throw error;
  }
};

/**
 * Mark message as read
 */
export const markMessageAsRead = async (messageId: string, userId: string) => {
  try {
    // Get the message
    const message = await databases.getDocument(
      DATABASE_ID,
      DIRECT_MESSAGES_COLLECTION_ID,
      messageId
    );

    // Check if user is the recipient
    if (message.recipientId !== userId) {
      throw new Error('You cannot mark this message as read');
    }

    // Update message
    const updatedMessage = await databases.updateDocument(
      DATABASE_ID,
      DIRECT_MESSAGES_COLLECTION_ID,
      messageId,
      {
        isRead: true,
      }
    );

    return {
      id: updatedMessage.$id,
      senderId: updatedMessage.senderId,
      recipientId: updatedMessage.recipientId,
      content: updatedMessage.content,
      replyToId: updatedMessage.replyToId,
      createdAt: updatedMessage.createdAt,
      isRead: updatedMessage.isRead,
      isDeleted: updatedMessage.isDeleted,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to mark message as read';
    console.error('Message read marking error:', errorMessage);
    throw error;
  }
};

/**
 * Delete direct message
 */
export const deleteDirectMessage = async (messageId: string, userId: string) => {
  try {
    // Get the message
    const message = await databases.getDocument(
      DATABASE_ID,
      DIRECT_MESSAGES_COLLECTION_ID,
      messageId
    );

    // Check if user is the sender
    if (message.senderId !== userId) {
      throw new Error('You cannot delete this message');
    }

    // Soft delete the message
    await databases.updateDocument(
      DATABASE_ID,
      DIRECT_MESSAGES_COLLECTION_ID,
      messageId,
      {
        isDeleted: true,
      }
    );

    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete message';
    console.error('Direct message deletion error:', errorMessage);
    throw error;
  }
};

/**
 * Get user's recent conversations
 */
export const getRecentConversations = async (userId: string) => {
  try {
    // Get messages where user is sender
    const sentMessages = await databases.listDocuments(
      DATABASE_ID,
      DIRECT_MESSAGES_COLLECTION_ID,
      [
        Query.equal('senderId', userId),
        Query.equal('isDeleted', false),
        Query.orderDesc('$createdAt')
      ]
    );

    // Around line 445
console.log("Sender query for user ID:", userId);
console.log("Sent messages:", sentMessages.documents.length);
// ...


    // Get messages where user is recipient
    const receivedMessages = await databases.listDocuments(
      DATABASE_ID,
      DIRECT_MESSAGES_COLLECTION_ID,
      [
        Query.equal('recipientId', userId),
        Query.equal('isDeleted', false),
        Query.orderDesc('$createdAt')
      ]
    );

    console.log("Received messages:", receivedMessages.documents.length);


    // Combine unique conversations
    const conversationMap = new Map();
    
    // Process sent messages
    sentMessages.documents.forEach(message => {
      const otherUserId = message.recipientId;
      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, {
          userId: otherUserId,
          lastMessage: {
            id: message.$id,
            content: message.content,
            createdAt: message.createdAt || message.$createdAt,
            isRead: message.isRead,
            senderId: message.senderId,
          },
          unreadCount: 0, // All sent messages are read by the current user
        });
      }
    });
    
    // Process received messages
    receivedMessages.documents.forEach(message => {
      const otherUserId = message.senderId;
      const unreadCount = message.isRead ? 0 : 1;
      
      if (!conversationMap.has(otherUserId)) {
        // New conversation
        conversationMap.set(otherUserId, {
          userId: otherUserId,
          lastMessage: {
            id: message.$id,
            content: message.content,
            createdAt: message.createdAt || message.$createdAt,
            isRead: message.isRead,
            senderId: message.senderId,
          },
          unreadCount,
        });
      } else if (new Date(message.createdAt || message.$createdAt) > new Date(conversationMap.get(otherUserId).lastMessage.createdAt)) {
        // If this message is newer than the current lastMessage
        const existing = conversationMap.get(otherUserId);
        conversationMap.set(otherUserId, {
          ...existing,
          lastMessage: {
            id: message.$id,
            content: message.content,
            createdAt: message.createdAt || message.$createdAt,
            isRead: message.isRead,
            senderId: message.senderId,
          },
          unreadCount: existing.unreadCount + unreadCount,
        });
      } else if (!message.isRead) {
        // If this is an older unread message, just increment the unread count
        const existing = conversationMap.get(otherUserId);
        conversationMap.set(otherUserId, {
          ...existing,
          unreadCount: existing.unreadCount + 1,
        });
      }
    });

    // Convert map to array and sort by most recent message
    return Array.from(conversationMap.values())
      .sort((a, b) => 
        new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
      );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get recent conversations';
    console.error('Recent conversations fetching error:', errorMessage);
    throw error;
  }
}; 