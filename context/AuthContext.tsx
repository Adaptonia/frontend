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

  // Enhanced fetchUser function with proper session restoration
  const fetchUser = useCallback(async () => {
    console.log("🔍 Starting session restoration check...");
    
    try {
      setLoading(true);
      
      // Call Appwrite's account.get() to check if session is valid
      // This automatically uses the HTTP-only session cookie
      const userData = await getCurrentUser();
      
      if (userData) {
        console.log("✅ Session restored successfully for:", userData.email);
        console.log("🔍 User session details:", {
          userType: userData.userType,
          hasCompletedUserTypeSelection: userData.hasCompletedUserTypeSelection,
          role: userData.role
        });
        
        // Cache user type info for offline access
        setUserTypeCache(userData);
        
        // Cache basic auth info for offline scenarios only
        if (typeof window !== 'undefined') {
          localStorage.setItem('adaptonia_auth_cache', JSON.stringify({
            id: userData.id,
            email: userData.email,
            name: userData.name,
            role: userData.role,
            lastValidated: Date.now()
          }));
        }
        
        setUser(userData);
        console.log("✅ Appwrite session is persistent and valid");
        return;
      }
      
      // If getCurrentUser returns null, session is invalid/expired
      console.log("ℹ️ No valid Appwrite session found - user needs to login");
      setUser(null);
      
      // Clear any stale cache when session is invalid
      clearUserTypeCache();
      if (typeof window !== 'undefined') {
        localStorage.removeItem('adaptonia_auth_cache');
      }
      
    } catch (error) {
      console.log("❌ Session restoration failed:", error instanceof Error ? error.message : 'Unknown error');
      
      // Only use cache as fallback for offline scenarios (not expired sessions)
      if (!navigator.onLine) {
        console.log("📱 Device appears offline, attempting to restore from cache...");
        
        try {
          const cachedAuth = localStorage.getItem('adaptonia_auth_cache');
          if (cachedAuth) {
            const authData = JSON.parse(cachedAuth);
            // Only use cache if it's less than 1 hour old (for offline scenarios only)
            const cacheAge = Date.now() - (authData.lastValidated || 0);
            
            if (authData.id && cacheAge < 60 * 60 * 1000) {
              const cachedUserType = getUserTypeFromCache(authData.id);
              if (cachedUserType) {
                console.log("🔄 Restored user session from offline cache");
                setUser({
                  ...authData,
                  ...cachedUserType
                });
                return;
              }
            }
          }
        } catch (cacheError) {
          console.warn('Failed to restore from cache:', cacheError);
        }
        
        console.log("❌ No valid offline cache available");
      } else {
        console.log("🌐 Device is online - session expired, clearing all cache");
        // Clear stale cache when online and session is invalid
        clearUserTypeCache();
        if (typeof window !== 'undefined') {
          localStorage.removeItem('adaptonia_auth_cache');
        }
      }
      
      // Set user to null when session is invalid
      setUser(null);
      
    } finally {
      setLoading(false);
    }
  }, []);

  // Session restoration on app startup
  useEffect(() => {
    console.log("🚀 AuthContext mounted - starting session restoration...");
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
          role: updatedUser.role,
          lastValidated: Date.now()
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
