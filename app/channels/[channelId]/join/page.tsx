'use client'
import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { joinChannelViaInvite } from '@/src/services/appwrite/channel';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

export default function JoinChannelPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const handleJoin = async () => {
    if (!code || !user?.id) return;
    
    try {
      setIsJoining(true);
      const result = await joinChannelViaInvite(code, user.id);
      toast.success('Success', {
        description: result.message || 'Successfully joined channel',
      });
      router.push(`/channels/${result.channelId}`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Failed to join channel');
        toast.error('Error', {
          description: err.message || 'Failed to join channel',
        });
      } else {
        setError('An unknown error occurred');
        toast.error('Error', {
          description: 'Failed to join channel',
        });
      }
    } finally {
      setIsJoining(false);
    }
  };

  useEffect(() => {
    // Auto-join if code is present
    if (code && user?.id) {
      handleJoin();
    }
  }, [code, user?.id]);

  if (!code) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4">Join Channel</h1>
          <p className="text-red-500 mb-4">No invite code provided</p>
          <Button onClick={() => router.push('/channels')}>
            Go to Channels
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Join Channel</h1>
        
        {error ? (
          <>
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={() => router.push('/channels')}>
              Go to Channels
            </Button>
          </>
        ) : (
          <>
            <p className="mb-4">Joining channel with invite code...</p>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}