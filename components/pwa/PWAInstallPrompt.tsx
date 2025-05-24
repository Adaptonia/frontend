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
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream: unknown }).MSStream;
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

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Install Adaptonia',
          text: 'Install Adaptonia app for a better experience',
          url: window.location.href,
        });
      } else {
        // Fallback for browsers that don't support Web Share API
        alert('To install: tap the share icon in your browser and select "Add to Home Screen"');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

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
                ? 'Click Share below and select "Add to Home Screen"' 
                : 'Install our app for a better experience'}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => setShowPrompt(false)} 
            className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Not now
          </button>
          {isIOSDevice ? (
            <button 
              onClick={handleShare}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            >
              <svg 
                className="w-4 h-4 mr-1" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              Share
            </button>
          ) : (
            <button 
              onClick={promptInstall} 
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            >
              <svg 
                className="w-4 h-4 mr-1" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Install
            </button>
          )}
        </div>
      </div>
    </div>
  );
}; 