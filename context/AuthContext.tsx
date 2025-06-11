'use client';

import { getCurrentUser, logoutUser } from '../src/services/appwrite';
import { AuthContextType, User } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState, createContext, useEffect, useContext, useCallback } from "react";

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Enhanced fetchUser function with proper error handling and logging
  const fetchUser = useCallback(async () => {
    console.log("🔍 Checking for existing Appwrite session...");
    try {
      // Get user from Appwrite
      const data = await getCurrentUser();
      console.log("✅ Found authenticated user:", data?.email);
      console.log("🔍 User data details:", {
        userType: data?.userType,
        hasCompletedUserTypeSelection: data?.hasCompletedUserTypeSelection,
        role: data?.role
      });
      setUser(data);
    } catch (error) {
      // This is expected when no user is logged in - don't log as error
      console.log("ℹ️ No authenticated user found (guest session)");
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
    
    // We could also set up a periodic refresh here if needed
    // const interval = setInterval(fetchUser, 5 * 60 * 1000); // Refresh every 5 minutes
    // return () => clearInterval(interval);
  }, [fetchUser]);

  const logout = async () => {
    try {
      await logoutUser();
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const updateUser = (updated: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updated } : prev));
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
