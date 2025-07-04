import { ID, OAuthProvider, Query } from 'appwrite';
import { account, databases, USERS_COLLECTION_ID, DATABASE_ID } from './client';
import { User, UserRole } from '@/lib/types';

// Import the correct OAuthProvider type

/**
 * Register a new user
 */
export const registerUser = async (email: string, password: string): Promise<User> => {
  try {
    // Create account in Appwrite Authentication
    const newAccount = await account.create(
      ID.unique(), 
      email, 
      password
    );

    // Send verification email
    // await account.createVerification(
    //   `${window.location.origin}/verify-email`
    // );

    // Use a properly typed UserRole
    const userRole: UserRole = 'user';

    // Create user document in database
    const newUser = await databases.createDocument(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      ID.unique(),
      {
        userId: newAccount.$id,
        email: email,
        profilePicture: null,
        role: userRole
      }
    );

    // Log created user data
    console.log('Created user document:', newUser);

    return {
      id: newAccount.$id,
      email: email,
      role: userRole
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Registration failed';
    console.error('Registration error:', errorMessage);
    throw error;
  }
};

/**
 * Login a user
 */
export const loginUser = async (email: string, password: string): Promise<User> => {
  try {
    console.log('🔐 Starting login process...');
    
    // Check if we already have an active session
    try {
      console.log('🔍 Checking for existing session...');
      const currentUser = await getCurrentUser();
      if (currentUser) {
        console.log('✅ Already logged in as:', currentUser.email);
        return currentUser;
      }
    } catch (error) {
      console.log('ℹ️ No existing session found, proceeding with login...');
    }
    
    // Create a new persistent session
    console.log('📥 Creating new persistent session...');
    const session = await account.createEmailPasswordSession(email, password);
    console.log('✅ Session created successfully:', session.$id);
    console.log('⏰ Session expires at:', session.expire);
    
    // Get current account
    console.log('🔍 Getting account details...');
    const accountDetails = await account.get();
    console.log('✅ Account details retrieved:', accountDetails.email);
    
    // Get user document from database
    console.log('🔍 Getting user document...');
    const users = await databases.listDocuments(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      [Query.equal('userId', accountDetails.$id)]
    );
    
    if (users.documents.length === 0) {
      console.error('❌ User document not found in database');
      throw new Error('User not found in database');
    }
    
    const userData = users.documents[0];
    console.log('✅ User document found:', userData);
    
    // Normalize role to lowercase and ensure it's a valid UserRole
    let role: UserRole = 'user'; // Default to user
    if (typeof userData.role === 'string') {
      const normalizedRole = userData.role.toLowerCase();
      // Only assign if it's a valid UserRole
      if (normalizedRole === 'admin' || normalizedRole === 'user') {
        role = normalizedRole as UserRole;
      }
    }
    
    const user = {
      id: accountDetails.$id,
      email: accountDetails.email,
      name: userData.name,
      profilePicture: userData.profilePicture,
      role: role
    };
    
    console.log("🎉 Login successful, returning user:", user.email);
    return user;
  } catch (error: unknown) {
    console.error('❌ Login error:', error);
    throw error;
  }
};

/**
 * Get the current logged in user
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    console.log('Getting current user from Appwrite...');
    
    // Check if there's an active session
    const accountDetails = await account.get();
    console.log('Found active Appwrite session:', accountDetails.$id);
    
    try {
      // Get user document from database
      const users = await databases.listDocuments(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        [Query.equal('userId', accountDetails.$id)]
      );
      
      if (users.documents.length === 0) {
        console.log('No user document found in database for user ID:', accountDetails.$id);
        
        // For OAuth users that might not have a document yet, create one
        if (accountDetails.email) {
          console.log('Creating missing user document for OAuth user:', accountDetails.email);
          
          // Create a basic user document
          const userRole: UserRole = 'user';
          const newUser = await databases.createDocument(
            DATABASE_ID,
            USERS_COLLECTION_ID,
            ID.unique(),
            {
              userId: accountDetails.$id,
              email: accountDetails.email,
              name: accountDetails.name || accountDetails.email.split('@')[0],
              profilePicture: null,
              role: userRole,
              userType: null,
              schoolName: null,
              hasCompletedUserTypeSelection: false
            }
          );
          
          return {
            id: accountDetails.$id,
            email: accountDetails.email,
            name: newUser.name,
            profilePicture: '',
            role: userRole,
            userType: null,
            schoolName: undefined,
            hasCompletedUserTypeSelection: false
          };
        }
        
        return null;
      }
      
      const userData = users.documents[0];
      
      // Normalize role to lowercase and ensure it's a valid UserRole
      let role: UserRole = 'user'; // Default to user
      if (typeof userData.role === 'string') {
        const normalizedRole = userData.role.toLowerCase();
        // Only assign if it's a valid UserRole
        if (normalizedRole === 'admin' || normalizedRole === 'user') {
          role = normalizedRole as UserRole;
        }
      }
      
      console.log('User data retrieved successfully:', userData.email || accountDetails.email);
      
      return {
        id: accountDetails.$id,
        email: accountDetails.email,
        name: userData.name,
        profilePicture: userData.profilePicture,
        role: role,
        userType: userData.userType || null,
        schoolName: userData.schoolName || undefined,
        hasCompletedUserTypeSelection: userData.hasCompletedUserTypeSelection || false
      };
    } catch (dbError) {
      console.error('Error getting user data from database:', dbError);
      
      // If we failed to get user data but have session, return basic user info
      if (accountDetails && accountDetails.email) {
        console.log('Returning basic user data from session');
        return {
          id: accountDetails.$id,
          email: accountDetails.email,
          name: accountDetails.name || accountDetails.email.split('@')[0],
          role: 'user',
          userType: null,
          schoolName: undefined,
          hasCompletedUserTypeSelection: false
        };
      }
      
      return null;
    }
  } catch (error: unknown) {
    // This is expected when no user is logged in - don't log as error in production
    if (process.env.NODE_ENV === 'development') {
      console.log('No active session found:', error);
    }
    return null;
  }
};

/**
 * Logout the current user
 */
export const logoutUser = async (): Promise<void> => {
  try {
    // Get all sessions and delete them
    try {
      // First try to delete the current session 
      await account.deleteSession('current');
      console.log('Successfully logged out current session');
    } catch (sessionError) {
      console.error('❌ Error deleting session:', sessionError);
      // If deleting current session fails, log but don't throw
      console.log('No active session found or session already expired');
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Logout failed';
    console.error('Logout error:', errorMessage);
    // Don't rethrow the error to prevent blocking the UI
    // Just log it and let the user continue
  }
};

/**
 * Request password reset
 */
export const requestPasswordReset = async (email: string): Promise<void> => {
  try {
    await account.createRecovery(
      email,
      `${window.location.origin}/reset-password`
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Password reset request failed';
    console.error('Password reset request error:', errorMessage);
    throw error;
  }
};

/**
 * Reset password
 */
export const resetPassword = async (
  userId: string,
  secret: string,
  password: string
): Promise<void> => {
  try {
    await account.updateRecovery(
      userId,
      secret,
      password
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
    console.error('Password reset error:', errorMessage);
    throw error;
  }
};

/**
 * Verify email
 */
export const verifyEmail = async (
  userId: string,
  secret: string
): Promise<void> => {
  try {
    await account.updateVerification(userId, secret);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Email verification failed';
    console.error('Email verification error:', errorMessage);
    throw error;
  }
};

// Add Google OAuth login function
/**
 * Initiate Google OAuth login
 */
export const loginWithGoogle = async (): Promise<void> => {
  try {
    // Get the current URL for redirects
    const origin = window.location.origin;
    const successUrl = `${origin}/oauth-callback`;  // Changed to callback page
    const failureUrl = `${origin}/login`;
    
    console.log('Google OAuth login initiated');
    console.log('Success redirect URL:', successUrl);
    
    // Create OAuth session with Google
    await account.createOAuth2Session(
      OAuthProvider.Google,
      successUrl,
      failureUrl
    );
  } catch (error: unknown) {
    console.error('Google login error details:', error);
    const errorMessage = error instanceof Error ? error.message : 'Google login failed';
    console.error('Google login error:', errorMessage);
    throw error;
  }
}; 
