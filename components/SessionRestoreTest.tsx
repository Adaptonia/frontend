'use client';

import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';

/**
 * Test component to verify session restoration is working
 * This can be temporarily added to any page to monitor session state
 */
export const SessionRestoreTest = () => {
  const { user, loading } = useAuth();
  const [mountTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    console.log('🧪 SessionRestoreTest: Component mounted at', mountTime);
    console.log('🧪 SessionRestoreTest: Initial state - loading:', loading, 'user:', user?.email || 'null');
  }, [mountTime, loading, user]);

  useEffect(() => {
    console.log('🧪 SessionRestoreTest: Auth state changed - loading:', loading, 'user:', user?.email || 'null');
  }, [loading, user]);

  if (process.env.NODE_ENV !== 'development') {
    return null; // Only show in development
  }

  return (
    <div className="fixed top-0 right-0 z-50 bg-black text-white text-xs p-2 max-w-xs">
      <div className="font-bold">Session Test ({mountTime})</div>
      <div>Loading: {loading ? 'true' : 'false'}</div>
      <div>User: {user ? user.email : 'null'}</div>
      <div>Status: {loading ? 'Checking...' : user ? '✅ Authenticated' : '❌ Not authenticated'}</div>
    </div>
  );
};

export default SessionRestoreTest; 