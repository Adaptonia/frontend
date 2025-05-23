'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import BottomNav from '@/components/dashboard/BottomNav';

export default function AdminPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const isAdmin = useIsAdmin();
  const router = useRouter();

  // Redirect non-admin users
  React.useEffect(() => {
    if (isAdmin === false) {
      router.push('/');
      toast.error('Access denied', {
        description: 'You do not have permission to access the admin area'
      });
    }
  }, [isAdmin, router]);

  const handlePromoteAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    try {
      // const result = await userApi.promoteToAdmin(email.trim());
      // toast.success('User promoted', {
      //   description: result.message
      // });
      setEmail('');
    } catch (error) {
      if (error instanceof Error) {
        toast.error('Error', {
          description: error.message
        });
      } else {
        toast.error('Error', {
          description: 'Failed to promote user. Please try again.'
        });
      }
      console.error('Failed to promote user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Show a loading state while checking admin status
  if (isAdmin === undefined) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // If the isAdmin check is complete and the user is still on this page, they are an admin
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Admin Management</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Promote User to Admin</h2>
        
        <form onSubmit={handlePromoteAdmin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">User Email Address</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
              className="w-full md:w-96"
            />
          </div>
          
          <Button
            type="submit"
            disabled={!email.trim() || isLoading}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            {isLoading ? 'Processing...' : 'Promote to Admin'}
          </Button>
        </form>
        
        <div className="mt-4 text-sm text-gray-600">
          <p>Note: This action will give the user full administrative privileges.</p>
        </div>
      </div>
      
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              Only promote trusted users who need administrative access. Admin users can manage channels, users, and settings.
            </p>
          </div>
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
} 