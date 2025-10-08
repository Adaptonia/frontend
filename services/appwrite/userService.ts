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

export interface AdminUser {
  $id: string;
  name: string;
  email: string;
  userType: 'student' | 'professional' | 'admin' | 'expert';
  $createdAt: string;
  lastLoginAt?: string;
  isActive: boolean;
  loginCount: number;
  schoolName?: string;
  role?: string;
  isExpert?: boolean;
  expertiseAreas?: string[];
}

export interface PromoteAdminResponse {
  success: boolean;
  message: string;
  user?: AdminUser;
}

export interface PromoteExpertResponse {
  success: boolean;
  message: string;
  user?: AdminUser;
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

// Get all users for admin dashboard
export const getAllUsers = async (): Promise<AdminUser[]> => {
  try {
    console.log('🔍 Fetching all users from database...');
    
    const response = await databases.listDocuments(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      [
        Query.orderDesc('$createdAt'),
        Query.limit(100) // Adjust as needed
      ]
    );

    console.log('📊 Raw database response:', response.documents.length, 'users found');
    
    const users = response.documents.map(doc => {
      const user = {
        $id: doc.$id,
        name: doc.name || 'Unknown User',
        email: doc.email || '',
        userType: doc.userType || 'student',
        $createdAt: doc.$createdAt,
        lastLoginAt: doc.lastLoginAt || undefined,
        isActive: doc.isActive !== false, // Default to true if not set
        loginCount: doc.loginCount || 0,
        schoolName: doc.schoolName || undefined,
        role: doc.role || undefined
      };
      
      console.log('👤 User data:', {
        id: user.$id,
        email: user.email,
        lastLoginAt: user.lastLoginAt,
        loginCount: user.loginCount,
        isActive: user.isActive
      });
      
      return user;
    });

    console.log('✅ Processed users:', users.length);
    return users;
  } catch (error) {
    console.error('❌ Error fetching all users:', error);
    throw new Error('Failed to fetch users');
  }
};

// Get user by ID
export const getUserById = async (userId: string): Promise<{success: boolean, data?: any}> => {
  try {
    console.log('🔍 Fetching user by ID:', userId);
    
    const response = await databases.listDocuments(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      [Query.equal('userId', userId)]
    );
    
    if (response.documents.length === 0) {
      console.log('❌ User not found:', userId);
      return { success: false };
    }
    
    const userData = response.documents[0];
    const user = {
      $id: userData.$id,
      userId: userData.userId,
      name: userData.name || 'Unknown User',
      email: userData.email || '',
      userType: userData.userType || 'student',
      $createdAt: userData.$createdAt,
      lastLoginAt: userData.lastLoginAt || undefined,
      isActive: userData.isActive !== false,
      loginCount: userData.loginCount || 0,
      schoolName: userData.schoolName || undefined,
      role: userData.role || undefined
    };
    
    console.log('✅ User found:', user.name);
    return { success: true, data: user };
  } catch (error) {
    console.error('❌ Error fetching user by ID:', error);
    return { success: false };
  }
};

// Promote user to admin
export const promoteToAdmin = async (email: string): Promise<PromoteAdminResponse> => {
  try {
    // First, find the user by email
    const usersResponse = await databases.listDocuments(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      [Query.equal('email', email)]
    );

    if (usersResponse.documents.length === 0) {
      throw new Error('User not found');
    }

    const user = usersResponse.documents[0];

    // Update the user's role to admin
    const updatedUser = await databases.updateDocument(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      user.$id,
      {
        role: 'admin',
        userType: 'admin'
      }
    );

    return {
      success: true,
      message: 'User promoted to admin successfully',
      user: {
        $id: updatedUser.$id,
        name: updatedUser.name || 'Unknown User',
        email: updatedUser.email || '',
        userType: 'admin',
        $createdAt: updatedUser.$createdAt,
        lastLoginAt: updatedUser.lastLoginAt || undefined,
        isActive: updatedUser.isActive !== false,
        loginCount: updatedUser.loginCount || 0,
        schoolName: updatedUser.schoolName || undefined,
        role: 'admin'
      }
    };
  } catch (error) {
    console.error('Error promoting user to admin:', error);
    throw new Error('Failed to promote user to admin');
  }
};

// Promote user to expert
export const promoteToExpert = async (email: string): Promise<PromoteExpertResponse> => {
  try {
    console.log('🔍 Promoting user to expert:', email);
    
    // Find user by email
    const users = await databases.listDocuments(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      [Query.equal('email', email)]
    );

    if (users.documents.length === 0) {
      return {
        success: false,
        message: 'User not found'
      };
    }

    const user = users.documents[0];
    
    // Update user to expert
    const updatedUser = await databases.updateDocument(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      user.$id,
      {
        userType: 'expert',
        isExpert: true,
        role: 'expert'
      }
    );

    console.log('✅ User promoted to expert successfully');

    return {
      success: true,
      message: 'User promoted to expert successfully',
      user: {
        $id: updatedUser.$id,
        name: updatedUser.name || 'Unknown User',
        email: updatedUser.email || '',
        userType: 'expert',
        $createdAt: updatedUser.$createdAt,
        lastLoginAt: updatedUser.lastLoginAt || undefined,
        isActive: updatedUser.isActive !== false,
        loginCount: updatedUser.loginCount || 0,
        schoolName: updatedUser.schoolName || undefined,
        role: 'expert',
        isExpert: true
      }
    };
  } catch (error) {
    console.error('Error promoting user to expert:', error);
    throw new Error('Failed to promote user to expert');
  }
};

// Update user's last login time and increment login count
export const updateUserLoginActivity = async (userId: string): Promise<void> => {
  try {
    console.log('🔄 Updating login activity for user:', userId);

    // Query user document by userId field
    const { Query } = await import('appwrite');
    const result = await databases.listDocuments(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      [Query.equal('userId', userId)]
    );

    if (result.documents.length === 0) {
      console.log('ℹ️ User document not found, skipping login activity update');
      return;
    }

    const user = result.documents[0];

    console.log('📊 Current user data:', {
      id: user.$id,
      email: user.email,
      hasLoginCount: user.loginCount !== undefined,
      hasLastLoginAt: user.lastLoginAt !== undefined
    });

    // Only update fields that exist in the schema
    const updateData: Record<string, unknown> = {};

    // Check if fields exist before trying to update them
    if (user.loginCount !== undefined) {
      const currentLoginCount = user.loginCount || 0;
      updateData.loginCount = currentLoginCount + 1;
    }

    if (user.lastLoginAt !== undefined) {
      updateData.lastLoginAt = new Date().toISOString();
    }

    if (user.isActive !== undefined) {
      updateData.isActive = true;
    }

    // Only update if we have fields to update
    if (Object.keys(updateData).length > 0) {
      console.log('📝 Updating user with data:', updateData);

      await databases.updateDocument(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        user.$id, // Use document ID, not userId
        updateData
      );

      console.log('✅ Login activity updated successfully');
    } else {
      console.log('ℹ️ No login activity fields to update (fields not in schema)');
    }
  } catch (error) {
    console.error('❌ Error updating user login activity:', error);
    console.error('Error details:', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    // Don't throw error as this shouldn't block the login process
  }
}; 

// Check if user document exists
export const ensureUserFields = async (userId: string): Promise<boolean> => {
  try {
    console.log('🔍 Checking if user document exists for:', userId);

    // Query by userId field, not document ID
    const { Query } = await import('appwrite');
    const result = await databases.listDocuments(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      [Query.equal('userId', userId)]
    );

    if (result.documents.length === 0) {
      console.log('ℹ️ User document not found in users collection');
      return false; // User document doesn't exist
    }

    console.log('✅ User document exists');
    return true; // User exists
  } catch (error: unknown) {
    const errorObj = error as { code?: number; message?: string };
    console.error('❌ Error checking user document:', {
      error: errorObj.message || 'Unknown error',
      userId
    });
    return false; // Error occurred
  }
}; 
