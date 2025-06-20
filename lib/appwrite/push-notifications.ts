import { ID, Query } from 'appwrite';
import { databases } from './config';
import { DATABASE_ID, PUSH_TOKENS_COLLECTION_ID } from '@/src/services/appwrite';



interface PushToken {
  userId: string;
  token: string;
  platform: string;
  createdAt: string;
}

export const pushNotificationService = {
  // Store FCM token in Appwrite
  async storePushToken(userId: string, token: string): Promise<void> {
    try {
      console.log('🔄 Storing FCM token in Appwrite...');
      console.log('Database ID:', DATABASE_ID);
      console.log('Collection ID:', PUSH_TOKENS_COLLECTION_ID);
      console.log('User ID:', userId);
      console.log('Token:', token);

      // Check if token already exists for this user
      console.log('Checking for existing tokens...');
      const existingTokens = await databases.listDocuments(
        DATABASE_ID,
        PUSH_TOKENS_COLLECTION_ID,
        [Query.equal('userId', userId)]
      );

      console.log('Existing tokens:', existingTokens);

      if (existingTokens.documents.length > 0) {
        // Update existing token
        console.log('Updating existing token...');
        await databases.updateDocument(
          DATABASE_ID as string,
          PUSH_TOKENS_COLLECTION_ID as string,
          existingTokens.documents[0].$id,
          {
            token,
            platform: this.getPlatform(),
            updatedAt: new Date().toISOString()
          }
        );
        console.log('✅ Token updated successfully');
      } else {
        // Create new token
        console.log('Creating new token document...');
        const newToken = await databases.createDocument(
          DATABASE_ID,
          PUSH_TOKENS_COLLECTION_ID,
          ID.unique(),
          {
            userId,
            token,
            platform: this.getPlatform(),
            createdAt: new Date().toISOString()
          }
        );
        console.log('✅ New token created:', newToken);
      }
    } catch (error) {
      console.error('❌ Failed to store push token:', error);
      // Log more details about the error
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  },

  // Get FCM token for a user
  async getPushToken(userId: string): Promise<string | null> {
    try {
      const tokens = await databases.listDocuments(
        DATABASE_ID,
        PUSH_TOKENS_COLLECTION_ID,
        [Query.equal('userId', userId)]
      );

      return tokens.documents[0]?.token || null;
    } catch (error) {
      console.error('Failed to get push token:', error);
      return null;
    }
  },

  // Delete FCM token for a user
  async deletePushToken(userId: string): Promise<void> {
    try {
      const tokens = await databases.listDocuments(
        DATABASE_ID,
        PUSH_TOKENS_COLLECTION_ID,
        [Query.equal('userId', userId)]
      );

      if (tokens.documents.length > 0) {
        await databases.deleteDocument(
          DATABASE_ID,
          PUSH_TOKENS_COLLECTION_ID,
          tokens.documents[0].$id
        );
      }
    } catch (error) {
      console.error('Failed to delete push token:', error);
      throw error;
    }
  },

  // Helper function to get platform
  getPlatform(): string {
    if (typeof window === 'undefined') return 'server';
    
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) return 'ios';
    if (/android/.test(userAgent)) return 'android';
    return 'web';
  }
}; 
