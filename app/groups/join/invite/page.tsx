'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function JoinChannelInvitePage() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would validate and process the invite code
    if (inviteCode.trim()) {
      router.push(`/groups/channel/${inviteCode}`);
    }
  };
  
  return (
    <div className="flex flex-col h-screen max-w-md mx-auto p-4">
      <div className="flex items-center mb-6">
        <button 
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-center flex-1">Join with Invite</h1>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-12 rounded-2xl mb-8 w-full max-w-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Invite Code
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter invite code"
              />
            </div>
            
            <button 
              type="submit"
              className="w-full bg-blue-500 text-white py-3 rounded-xl font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!inviteCode.trim()}
            >
              Join Channel
            </button>
          </form>
        </div>
        
        <p className="text-sm text-gray-500 text-center">
          Don&apos;t have an invite code? <br />
          <button 
            onClick={() => router.push('/groups/join')}
            className="text-blue-500 hover:underline mt-1"
          >
            Browse available channels
          </button>
        </p>
      </div>
    </div>
  );
} 