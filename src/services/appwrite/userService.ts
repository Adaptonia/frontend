import { databases, USERS_COLLECTION_ID, DATABASE_ID } from './client';
import { Query } from 'appwrite';
import { UserType } from '@/lib/types';

export interface UpdateUserTypeRequest {
  userId: string;
  userType: UserType;
  schoolName?: string;
}

export interface UpdateUserProfileRequest {
  userId: string;
  name?: string;
  email?: string;
  profilePicture?: string;
}

// Cache utilities for offline support
const USER_TYPE_CACHE_KEY = 'adaptonia_user_type_cache';

interface UserTypeCache {
  userId: string;
  userType: string | null;
  schoolName?: string;
  hasCompletedUserTypeSelection: boolean;
  timestamp: number;
}

const getUserTypeFromCache = (userId: string): {
  userType: UserType;
  schoolName?: string;
  hasCompleted: boolean;
} | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const cached = localStorage.getItem(USER_TYPE_CACHE_KEY);
    if (!cached) return null;
    
    const cacheData: UserTypeCache = JSON.parse(cached);
    
    // Check if cache is for the right user and not too old (24 hours)
    const isValidCache = cacheData.userId === userId && 
                        Date.now() - cacheData.timestamp < 24 * 60 * 60 * 1000;
    
    if (!isValidCache) return null;
    
    return {
      userType: cacheData.userType as UserType,
      schoolName: cacheData.schoolName,
      hasCompleted: cacheData.hasCompletedUserTypeSelection
    };
  } catch (error) {
    console.warn('Failed to read user type cache:', error);
    return null;
  }
};

const setUserTypeCache = (userId: string, userType: UserType, schoolName?: string): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const cacheData: UserTypeCache = {
      userId,
      userType,
      schoolName,
      hasCompletedUserTypeSelection: true,
      timestamp: Date.now()
    };
    
    localStorage.setItem(USER_TYPE_CACHE_KEY, JSON.stringify(cacheData));
    console.log('✅ User type cached locally for offline access');
  } catch (error) {
    console.warn('Failed to cache user type:', error);
  }
};

/**
 * Update user type and school information
 */
export const updateUserType = async (data: UpdateUserTypeRequest): Promise<boolean> => {
  try {
    console.log('Updating user type for user:', data.userId);
    
    // Cache the update locally first (optimistic update)
    setUserTypeCache(data.userId, data.userType, data.schoolName);
    
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
    
    console.log('✅ User type updated successfully in database');
    return true;
  } catch (error) {
    console.error('❌ Failed to update user type in database:', error);
    
    // For offline scenarios, the cache update above still worked
    // So we can return true if we have cached the data locally
    const cachedData = getUserTypeFromCache(data.userId);
    if (cachedData && cachedData.userType === data.userType) {
      console.log('✅ User type cached locally (will sync when online)');
      return true;
    }
    
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
 * Get user type information with offline support
 */
export const getUserTypeInfo = async (userId: string): Promise<{
  userType: UserType;
  schoolName?: string;
  hasCompleted: boolean;
} | null> => {
  try {
    // Try to get from database first
    const users = await databases.listDocuments(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      [Query.equal('userId', userId)]
    );
    
    if (users.documents.length === 0) {
      // If no database record, check cache
      return getUserTypeFromCache(userId);
    }
    
    const userData = users.documents[0];
    const result = {
      userType: userData.userType || null,
      schoolName: userData.schoolName || undefined,
      hasCompleted: userData.hasCompletedUserTypeSelection === true
    };
    
    // Update cache with fresh data
    if (result.userType) {
      setUserTypeCache(userId, result.userType, result.schoolName);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Failed to get user type info from database, checking cache:', error);
    
    // Fallback to cached data for offline scenarios
    const cachedData = getUserTypeFromCache(userId);
    if (cachedData) {
      console.log('✅ Using cached user type info (offline mode)');
      return cachedData;
    }
    
    return null;
  }
};

/**
 * Update user profile information (name, email, profile picture)
 */
export const updateUserProfile = async (data: UpdateUserProfileRequest): Promise<boolean> => {
  try {
    console.log('Updating user profile for user:', data.userId);
    
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
    
    // Prepare update data (only include defined fields)
    const updateData: Record<string, any> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.profilePicture !== undefined) updateData.profilePicture = data.profilePicture;
    
    // Update the user document
    await databases.updateDocument(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      userDoc.$id,
      updateData
    );
    
    console.log('✅ User profile updated successfully in database');
    return true;
  } catch (error) {
    console.error('❌ Failed to update user profile in database:', error);
    throw error;
  }
}; 
