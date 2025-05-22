'use client';

import { useAuth } from '@/context/AuthContext';

export function useIsAdmin() {
  const { user } = useAuth();

  
  // Check if the current user has admin role
  const isAdmin = user?.role === 'admin';
  
  return isAdmin;
} 