import { 
  getRecentConversations, 
  getConversation, 
  sendDirectMessage, 
  markMessageAsRead, 
} from '@/src/services/appwrite/messaging';
import { getCurrentUser } from '@/src/services/appwrite/auth';

export interface Message {
  id: string;
  content: string;
  senderId: string;
  recipientId: string;
  createdAt: string;
  isRead: boolean;
  isDeleted: boolean;
  replyToId?: string;
  sender?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
}

export interface ChatPreview {
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    isFromCurrentUser: boolean;
    read: boolean;
  };
  unreadCount: number;
}

export const chatApi = {
  // Get direct messages between the current user and another user
  getDirectMessages: async (otherUserId: string): Promise<Message[]> => {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    const messages = await getConversation(currentUser.id!, otherUserId);
    
    // Format the messages to match the expected interface
    return messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      senderId: msg.senderId,
      recipientId: msg.recipientId,
      createdAt: msg.createdAt,
      isRead: msg.isRead,
      isDeleted: msg.isDeleted,
      replyToId: msg.replyToId,
      // Sender info would need to be fetched separately if needed
    }));
  },

  // Send a direct message to another user
  sendDirectMessage: async (receiverId: string, content: string): Promise<Message> => {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    const message = await sendDirectMessage(currentUser.id!, receiverId, content);
    
    return {
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      recipientId: message.recipientId,
      createdAt: message.createdAt,
      isRead: message.isRead,
      isDeleted: message.isDeleted,
      replyToId: message.replyToId,
    };
  },

  // Mark messages from a specific user as read
  markMessagesAsRead: async (otherUserId: string): Promise<{ success: boolean }> => {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    // Get unread messages from the other user
    const messages = await getConversation(currentUser.id!, otherUserId);
    const unreadMessages = messages.filter(
      msg => msg.senderId === otherUserId && !msg.isRead
    );
    
    // Mark each unread message as read
    const promises = unreadMessages.map(msg => 
      markMessageAsRead(msg.id, currentUser.id!)
    );
    
    await Promise.all(promises);
    return { success: true };
  },

  // Get recent chats (conversations) for the current user
  getRecentChats: async (): Promise<ChatPreview[]> => {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    const conversations = await getRecentConversations(currentUser.id!);
    
    // Transform the data to match the expected interface
    return conversations.map(conversation => ({
      user: {
        id: conversation.userId,
        // User details would need to be fetched separately in a real implementation
        // For now, we'll just use the ID
        email: conversation.userId, // Placeholder
      },
      lastMessage: {
        id: conversation.lastMessage.id,
        content: conversation.lastMessage.content,
        createdAt: conversation.lastMessage.createdAt,
        isFromCurrentUser: conversation.lastMessage.senderId === currentUser.id!,
        read: conversation.lastMessage.isRead,
      },
      unreadCount: conversation.unreadCount,
    }));
  }
}; 
