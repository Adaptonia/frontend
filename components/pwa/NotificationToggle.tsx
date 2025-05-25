'use client';

import React, { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { toast } from 'sonner';
import { requestNotificationPermission } from '@/app/sw-register';

export const NotificationToggle: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if notifications are enabled on component mount
  useEffect(() => {
    const checkNotificationStatus = async () => {
      // Check if browser supports notifications
      if (!('Notification' in window)) {
        return;
      }
      
      // Check if permission is already granted
      if (Notification.permission === 'granted') {
        setIsEnabled(true);
      }
    };
    
    checkNotificationStatus();
  }, []);

  const toggleNotifications = async () => {
    setIsLoading(true);
    
    try {
      if (!isEnabled) {
        // Request notification permission
        const permissionGranted = await requestNotificationPermission();
        
        if (permissionGranted) {
          setIsEnabled(true);
          toast.success('Notifications enabled');
          
          // Send a test notification after a short delay
          setTimeout(() => {
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
              navigator.serviceWorker.ready.then(registration => {
                registration.showNotification('Adaptonia Notifications', {
                  body: 'You will now receive reminders for your goals!',
                  icon: '/icons/icon-192x192.png',
                  badge: '/icons/icon-72x72.png',
                  // @ts-ignore - vibrate is valid for mobile but not in TS types
                  vibrate: [100, 50, 100]
                });
              });
            }
          }, 1500);
        } else {
          toast.error('Permission denied. Please enable notifications in your browser settings.');
        }
      } else {
        // For now, we can't programmatically revoke permissions in most browsers
        // So we'll just show instructions to the user
        toast.info(
          <div className="flex flex-col gap-1">
            <span className="font-medium">To disable notifications:</span>
            <span className="text-sm text-gray-600">
              Please go to your browser settings and disable notifications for this site.
            </span>
          </div>
        );
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      toast.error('Failed to toggle notifications');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-10 h-10 mr-3 rounded-full bg-blue-100 flex items-center justify-center">
            {isEnabled ? 
              <Bell className="w-5 h-5 text-blue-500" /> : 
              <BellOff className="w-5 h-5 text-gray-400" />
            }
          </div>
          <div>
            <h3 className="font-medium">Notifications</h3>
            <p className="text-sm text-gray-500">
              {isEnabled ? 'Enabled for all reminders' : 'Get notified about your goals'}
            </p>
          </div>
        </div>
        
        <button 
          onClick={toggleNotifications}
          disabled={isLoading}
          className={`relative w-14 h-7 rounded-full transition-colors ${
            isEnabled ? 'bg-blue-500' : 'bg-gray-300'
          }`}
        >
          <span 
            className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${
              isEnabled ? 'right-1' : 'left-1'
            } ${isLoading ? 'animate-pulse' : ''}`}
          />
        </button>
      </div>
    </div>
  );
}; 