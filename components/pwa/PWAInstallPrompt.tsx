'use client';

import { usePWA } from '@/src/context/PWAContext';
import React, { useState, useEffect } from 'react';

export const PWAInstallPrompt: React.FC = () => {
  const { isPWAInstalled, promptInstall } = usePWA();
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Detect iOS devices
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    // Detect standalone mode (already installed)
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
    
    setIsIOSDevice(isIOS);
    
    // Only show prompt if not installed and not on iOS (or on iOS and not in standalone)
    if (!isPWAInstalled && (!isIOS || !isInStandaloneMode)) {
      // Wait a bit before showing the prompt to avoid annoying users immediately
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isPWAInstalled]);

  if (isPWAInstalled || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 p-4 shadow-lg z-50 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img src="/logo.png" alt="Adaptonia Logo" className="w-10 h-10" />
          <div>
            <h3 className="font-semibold dark:text-white">Install Adaptonia</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isIOSDevice 
                ? 'Tap Share and then "Add to Home Screen"' 
                : 'Install our app for a better experience'}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => setShowPrompt(false)} 
            className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400"
          >
            Not now
          </button>
          {!isIOSDevice && (
            <button 
              onClick={promptInstall} 
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md"
            >
              Install
            </button>
          )}
        </div>
      </div>
    </div>
  );
}; 