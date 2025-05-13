'use client'
import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight } from 'lucide-react';

// Create channel category component
const ChannelCategory = ({ icon, name, color }: { icon: React.ReactNode, name: string, color: string }) => (
  <div className="flex items-center justify-between p-4 my-2 bg-white dark:bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 ${color} rounded-full flex items-center justify-center`}>
        {icon}
      </div>
      <span className="font-medium">{name}</span>
    </div>
    <ChevronRight className="h-5 w-5 text-gray-400" />
  </div>
);

export default function JoinChannelPage() {
  const router = useRouter();
  
  return (
    <div className="flex flex-col h-screen max-w-md mx-auto p-4">
      <div className="flex items-center mb-6">
        <button 
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-center flex-1">Join a Channel</h1>
      </div>
      
      <p className="text-gray-500 text-center mb-8">
        Join an existing channel to discuss and share new ideas
      </p>
      
      <div className="space-y-2">
        <ChannelCategory 
          icon={<span className="text-green-600">💰</span>} 
          name="Finance" 
          color="bg-green-100" 
        />
        <ChannelCategory 
          icon={<span className="text-blue-600">🧑‍💼</span>} 
          name="Career" 
          color="bg-blue-100" 
        />
        <ChannelCategory 
          icon={<span className="text-red-600">📚</span>} 
          name="Learning" 
          color="bg-red-100" 
        />
        <ChannelCategory 
          icon={<span className="text-orange-600">💪</span>} 
          name="Fitness" 
          color="bg-orange-100" 
        />
        <ChannelCategory 
          icon={<span className="text-yellow-600">❤️</span>} 
          name="Relationship" 
          color="bg-yellow-100" 
        />
      </div>
      
      <div className="mt-auto">
        <p className="text-center mb-4">Have an invite already?</p>
        <button 
          className="w-full bg-blue-500 text-white py-3 rounded-xl font-medium hover:bg-blue-600"
          onClick={() => router.push('/groups/join/invite')}
        >
          Join Channel
        </button>
      </div>
    </div>
  );
} 