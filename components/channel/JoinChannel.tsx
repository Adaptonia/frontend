'use client'
import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { channelApi } from '@/lib/api/channel';

export function JoinChannel() {
  const [inviteLink, setInviteLink] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const extractInviteCode = (link: string): string | null => {
    try {
      // Handle both full URL and direct code formats
      if (link.includes('code=')) {
        const url = new URL(link);
        return url.searchParams.get('code');
      }
      // If it's just the code itself, return it
      if (link.match(/^[a-f0-9-]{36,}$/)) {
        return link;
      }
      return null;
    } catch {
      return null;
    }
  };

  const handleJoin = async () => {
    setError(null);
    const code = extractInviteCode(inviteLink);
    
    if (!code) {
      setError('Invalid invite link format');
      toast.error('Please enter a valid invite link');
      return;
    }
    
    try {
      setIsJoining(true);
      const result = await channelApi.joinByInviteCode(code);
      toast.success('Successfully joined channel');
      router.push(`/channels/${result.channelId}`);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to join channel';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Main content area */}
      <div className="px-4 py-6">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button 
            onClick={() => router.back()} 
            className="p-2 hover:bg-gray-100 rounded-full dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col items-center">
          <h1 className="text-2xl font-semibold mb-2">Join an existing group</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Enter an invitation link to join a group
          </p>

          <div className="w-full max-w-md">
            <label className="block text-sm font-medium mb-2">Invite Link</label>
            <input
              type="text"
              value={inviteLink}
              onChange={(e) => setInviteLink(e.target.value)}
              placeholder="http://localhost:3000/channels/join?code=your-invite-code"
              className={`w-full p-3 border rounded-lg mb-2 transition-colors ${
                error 
                  ? 'border-red-500 dark:border-red-500' 
                  : 'border-gray-300 dark:border-gray-700'
              }`}
            />
            {error && (
              <p className="text-sm text-red-500 mb-2">{error}</p>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter the full invite link or just the invite code
            </p>
          </div>
        </div>
      </div>

      {/* Bottom fixed button */}
      <div className="mt-auto px-4 py-6 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleJoin}
            disabled={isJoining || !inviteLink.trim()}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-colors"
          >
            {isJoining ? 'Joining...' : 'Join with invite link'}
          </button>
        </div>
      </div>
    </div>
  );
} 