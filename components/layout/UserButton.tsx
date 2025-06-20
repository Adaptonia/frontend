import React from 'react';
import { Avatar, AvatarFallback } from '../ui/avatar';

export function UserButton() {
  return (
    <a href="/profile" className="flex flex-col items-center">
      <Avatar className="h-6 w-6">
        <AvatarFallback>U</AvatarFallback>
      </Avatar>
    </a>
  );
} 
