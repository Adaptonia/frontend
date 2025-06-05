import { databases, USERS_COLLECTION_ID, DATABASE_ID } from './client';
import { Query } from 'appwrite';
import { UserType } from '@/lib/types';

export interface UpdateUserTypeRequest {
  userId: string;
  userType: UserType;
  schoolName?: string;
}

/**
 * Update user type and school information
 */
export const updateUserType = async (data: UpdateUserTypeRequest): Promise<boolean> => {
  try {
    console.log('Updating user type for user:', data.userId);
    
    // Get the user document first
    const users = await databases.listDocuments(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      [Query.equal('userId', data.userId)]
    );
    
    if (users.documents.length === 0) {
      throw new Error('User not found');
    }
    
    const userDoc = users.documents[0];
    
    // Update the user document with new type information
    await databases.updateDocument(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      userDoc.$id,
      {
        userType: data.userType,
        schoolName: data.schoolName || null,
        hasCompletedUserTypeSelection: true
      }
    );
    
    console.log('✅ User type updated successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to update user type:', error);
    throw error;
  }
};

/**
 * Check if user has completed user type selection
 */
export const hasCompletedUserTypeSelection = async (userId: string): Promise<boolean> => {
  try {
    const users = await databases.listDocuments(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      [Query.equal('userId', userId)]
    );
    
    if (users.documents.length === 0) {
      return false;
    }
    
    const userData = users.documents[0];
    return userData.hasCompletedUserTypeSelection === true;
  } catch (error) {
    console.error('❌ Failed to check user type selection status:', error);
    return false;
  }
};

/**
 * Get user type information
 */
export const getUserTypeInfo = async (userId: string): Promise<{
  userType: UserType;
  schoolName?: string;
  hasCompleted: boolean;
} | null> => {
  try {
    const users = await databases.listDocuments(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      [Query.equal('userId', userId)]
    );
    
    if (users.documents.length === 0) {
      return null;
    }
    
    const userData = users.documents[0];
    return {
      userType: userData.userType || null,
      schoolName: userData.schoolName || undefined,
      hasCompleted: userData.hasCompletedUserTypeSelection === true
    };
  } catch (error) {
    console.error('❌ Failed to get user type info:', error);
    return null;
  }
}; 