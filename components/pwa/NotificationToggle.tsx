'use client';

import { usePWA } from '@/src/context/PWAContext';
import React from 'react';

export const NotificationToggle: React.FC = () => {
  const { 
    isNotificationsEnabled, 
    enableNotifications, 
    disableNotifications,
    sendTestNotification 
  } = usePWA();

  const handleToggle = async () => {
    if (isNotificationsEnabled) {
      await disableNotifications();
    } else {
      await enableNotifications();
    }
  };

  return (
    <div className="flex flex-col space-y-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium dark:text-white">Push Notifications</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isNotificationsEnabled 
              ? 'You will receive notifications when not using the app' 
              : 'Enable notifications to stay updated'}
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            checked={isNotificationsEnabled} 
            onChange={handleToggle} 
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
        </label>
      </div>

      {isNotificationsEnabled && (
        <button 
          onClick={sendTestNotification}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-sm rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-white transition"
        >
          Send Test Notification
        </button>
      )}
    </div>
  );
}; 