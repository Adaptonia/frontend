'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  isTyping: boolean;
  className?: string;
  text?: string;
}

export function TypingIndicator({ 
  isTyping,
  className,
  text = 'typing' 
}: TypingIndicatorProps) {
  if (!isTyping) return null;
  
  return (
    <div className={cn('flex items-center text-gray-500 text-sm', className)}>
      <div className="flex space-x-1 mr-2">
        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span>{text}</span>
    </div>
  );
} 
