'use client';

import api from "@/lib/apiClient";
import { getCurrentUser, logoutUser } from "@/lib/auth";
import { AuthContextType, User } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState, createContext, useEffect, useContext } from "react";

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUser = async () => {
    try {
      const data = await getCurrentUser(); // This should use the centralized `api` internally
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
      setUser(null);
      router.push("/home");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const updateUser = (updated: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updated } : prev));
  };

  useEffect(() => {
    const init = async () => {
      await fetchUser();
    };
    init();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, setUser, logout, updateUser }}>
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
