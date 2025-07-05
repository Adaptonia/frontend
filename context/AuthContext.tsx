'use client';

import { getCurrentUser, logoutUser } from '../services/appwrite';
import { AuthContextType, User } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState, createContext, useEffect, useContext, useCallback } from "react";

const AuthContext = createContext<AuthContextType | null>(null);

// User type cache utilities
const USER_TYPE_CACHE_KEY = 'adaptonia_user_type_cache';

interface UserTypeCache {
  userId: string;
  userType: string | null;
  schoolName?: string;
  hasCompletedUserTypeSelection: boolean;
  timestamp: number;
}

const getUserTypeFromCache = (userId: string): Partial<User> | null => {
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
      userType: cacheData.userType as any,
      schoolName: cacheData.schoolName,
      hasCompletedUserTypeSelection: cacheData.hasCompletedUserTypeSelection
    };
  } catch (error) {
    console.warn('Failed to read user type cache:', error);
    return null;
  }
};

const setUserTypeCache = (user: User): void => {
  if (typeof window === 'undefined' || !user.id) return;
  
  try {
    const cacheData: UserTypeCache = {
      userId: user.id,
      userType: user.userType || null,
      schoolName: user.schoolName,
      hasCompletedUserTypeSelection: user.hasCompletedUserTypeSelection || false,
      timestamp: Date.now()
    };
    
    localStorage.setItem(USER_TYPE_CACHE_KEY, JSON.stringify(cacheData));
    console.log('✅ User type cached locally for offline access');
  } catch (error) {
    console.warn('Failed to cache user type:', error);
  }
};

const clearUserTypeCache = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(USER_TYPE_CACHE_KEY);
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Enhanced fetchUser function with proper error handling and session persistence
  const fetchUser = useCallback(async () => {
    console.log("🔍 Checking for existing Appwrite session...");
    try {
      // Get user from Appwrite - this checks if the session is still valid
      const data = await getCurrentUser();
      console.log("✅ Found authenticated user:", data?.email);
      console.log("🔍 User data details:", {
        userType: data?.userType,
        hasCompletedUserTypeSelection: data?.hasCompletedUserTypeSelection,
        role: data?.role
      });
      
      if (data) {
        // Cache user type info for offline access
        setUserTypeCache(data);
        
        // Also cache basic auth info
        if (typeof window !== 'undefined') {
          localStorage.setItem('adaptonia_auth_cache', JSON.stringify({
            id: data.id,
            email: data.email,
            name: data.name,
            role: data.role,
            lastValidated: Date.now()
          }));
        }
        
        setUser(data);
        console.log("✅ Session is valid and persistent for ~1 week");
      }
    } catch (error) {
      console.log("ℹ️ No valid Appwrite session found");
      
      // Only use cache as a very last resort for offline scenarios (not for expired sessions)
      // Check if we're actually offline vs just having an expired session
      if (!navigator.onLine) {
        console.log("📱 Device appears offline, checking cache...");
        
        const cachedAuth = localStorage.getItem('adaptonia_auth_cache');
        if (cachedAuth) {
          try {
            const authData = JSON.parse(cachedAuth);
            // Only use cache if it's less than 1 hour old (for offline scenarios)
            const cacheAge = Date.now() - (authData.lastValidated || 0);
            if (authData.id && cacheAge < 60 * 60 * 1000) {
              const cachedUserType = getUserTypeFromCache(authData.id);
              if (cachedUserType) {
                console.log("🔄 Using cached user data for offline access");
                setUser({
                  ...authData,
                  ...cachedUserType
                });
                return;
              }
            }
          } catch (cacheError) {
            console.warn('Failed to parse cached auth data:', cacheError);
          }
        }
      } else {
        console.log("🌐 Device is online - session expired or invalid, clearing cache");
        // Clear stale cache when online and session is invalid
        clearUserTypeCache();
        localStorage.removeItem('adaptonia_auth_cache');
      }
      
      // Only log detailed error in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Auth check details:', error);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Use effect to check auth on mount - this is critical for OAuth redirects
  useEffect(() => {
    console.log("🔄 AuthContext mounted - checking authentication");
    fetchUser();
  }, [fetchUser]);

  const logout = async () => {
    try {
      await logoutUser();
      // Clear all cached data on logout
      clearUserTypeCache();
      localStorage.removeItem('adaptonia_auth_cache');
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const updateUser = (updated: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      
      const updatedUser = { ...prev, ...updated };
      
      // Update cache with new user type information
      if (updated.userType !== undefined || updated.schoolName !== undefined || updated.hasCompletedUserTypeSelection !== undefined) {
        setUserTypeCache(updatedUser);
        console.log('✅ User type cache updated');
      }
      
      // Also update basic auth cache
      if (typeof window !== 'undefined') {
        localStorage.setItem('adaptonia_auth_cache', JSON.stringify({
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role
        }));
      }
      
      return updatedUser;
    });
  };

  const value = {
    user,
    setUser,
    loading,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
