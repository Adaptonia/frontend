'use client';

import { useUserStatus } from '@/hooks/useUserStatus';
import React from 'react';
import { cn } from '@/lib/utils';

interface UserStatusBadgeProps {
  userId: string;
  className?: string;
}

export function UserStatusBadge({ userId, className }: UserStatusBadgeProps) {
  const { isUserOnline } = useUserStatus();
  const online = isUserOnline(userId);
  
  return (
    <div 
      className={cn(
        'h-2.5 w-2.5 rounded-full border-2 border-white',
        online ? 'bg-green-500' : 'bg-gray-300',
        className
      )} 
      title={online ? 'Online' : 'Offline'}
    />
  );
} 