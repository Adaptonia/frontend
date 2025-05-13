"use client"

import React from 'react';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Avatar({ className, ...props }: AvatarProps) {
  return (
    <div className={`relative rounded-full overflow-hidden ${className || ''}`} {...props} />
  );
}

export function AvatarImage({ src, alt = '', ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  return src ? <img src={src} alt={alt} className="w-full h-full object-cover" {...props} /> : null;
}

export function AvatarFallback({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={`flex h-full w-full items-center justify-center bg-gray-200 text-gray-700 ${className || ''}`} 
      {...props} 
    />
  );
}
