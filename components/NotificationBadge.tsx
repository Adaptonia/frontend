'use client';

import { useEffect, useState } from 'react';
import { getBadgeCount } from '@/app/sw-register';

interface NotificationBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal';
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  className = '',
  size = 'md',
  variant = 'default'
}) => {
  const [badgeCount, setBadgeCount] = useState(0);

  useEffect(() => {
    // Get initial badge count
    setBadgeCount(getBadgeCount());

    // Listen for badge count updates from service worker
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'BADGE_COUNT_UPDATED') {
        setBadgeCount(event.data.count || 0);
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleMessage);
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      }
    };
  }, []);

  // Don't render if count is 0
  if (badgeCount <= 0) {
    return null;
  }

  // Size classes
  const sizeClasses = {
    sm: 'h-4 w-4 text-xs',
    md: 'h-5 w-5 text-xs',
    lg: 'h-6 w-6 text-sm'
  };

  // Variant classes
  const variantClasses = {
    default: 'bg-red-500 text-white',
    minimal: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-200'
  };

  return (
    <div
      className={`
        absolute -top-1 -right-1 z-10
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        rounded-full
        flex items-center justify-center
        font-medium
        border-2 border-white dark:border-gray-900
        shadow-sm
        animate-pulse
        ${className}
      `}
      aria-label={`${badgeCount} unread notifications`}
      role="status"
    >
      {badgeCount > 99 ? '99+' : badgeCount}
    </div>
  );
};

// Hook to use badge count in other components
export const useNotificationBadge = () => {
  const [badgeCount, setBadgeCount] = useState(0);

  useEffect(() => {
    // Get initial badge count
    setBadgeCount(getBadgeCount());

    // Listen for badge count updates from service worker
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'BADGE_COUNT_UPDATED') {
        setBadgeCount(event.data.count || 0);
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleMessage);
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      }
    };
  }, []);

  return badgeCount;
};

export default NotificationBadge; 