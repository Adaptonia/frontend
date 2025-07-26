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
  userType: 'student' | 'professional' | 'admin';
  $createdAt: string;
  lastLoginAt?: string;
  isActive: boolean;
  loginCount: number;
  schoolName?: string;
  role?: string;
}

export interface PromoteAdminResponse {
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

// Update user's last login time and increment login count
export const updateUserLoginActivity = async (userId: string): Promise<void> => {
  try {
    console.log('🔄 Updating login activity for user:', userId);
    
    // First ensure the user has the required fields
    await ensureUserFields(userId);
    
    const user = await databases.getDocument(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      userId
    );

    console.log('📊 Current user data:', {
      id: user.$id,
      email: user.email,
      currentLoginCount: user.loginCount,
      currentLastLogin: user.lastLoginAt
    });

    const currentLoginCount = user.loginCount || 0;

    const updateData = {
      lastLoginAt: new Date().toISOString(),
      loginCount: currentLoginCount + 1,
      isActive: true
    };

    console.log('📝 Updating user with data:', updateData);

    const updatedUser = await databases.updateDocument(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      userId,
      updateData
    );

    console.log('✅ Login activity updated successfully:', {
      newLoginCount: updatedUser.loginCount,
      newLastLogin: updatedUser.lastLoginAt
    });
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

// Check if user document has required fields, if not, create them
export const ensureUserFields = async (userId: string): Promise<void> => {
  try {
    console.log('🔍 Checking user fields for:', userId);
    
    const user = await databases.getDocument(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      userId
    );

    const needsUpdate = !user.lastLoginAt || user.loginCount === undefined || user.isActive === undefined;
    
    if (needsUpdate) {
      console.log('⚠️ User missing required fields, updating...');
      
      const updateData: any = {};
      
      if (!user.lastLoginAt) {
        updateData.lastLoginAt = new Date().toISOString();
      }
      
      if (user.loginCount === undefined) {
        updateData.loginCount = 0;
      }
      
      if (user.isActive === undefined) {
        updateData.isActive = true;
      }
      
      if (Object.keys(updateData).length > 0) {
        await databases.updateDocument(
          DATABASE_ID,
          USERS_COLLECTION_ID,
          userId,
          updateData
        );
        console.log('✅ User fields updated:', updateData);
      }
    } else {
      console.log('✅ User has all required fields');
    }
  } catch (error) {
    console.error('❌ Error ensuring user fields:', error);
  }
}; 
