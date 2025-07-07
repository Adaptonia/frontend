'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isInstalling: boolean;
  isWaiting: boolean;
  isControlling: boolean;
  hasUpdate: boolean;
}

interface CacheStatus {
  [cacheName: string]: {
    size: number;
    lastUpdated: number;
  };
}

export const ServiceWorkerRegistration = () => {
  const [swState, setSwState] = useState<ServiceWorkerState>({
    isSupported: false,
    isRegistered: false,
    isInstalling: false,
    isWaiting: false,
    isControlling: false,
    hasUpdate: false,
  });

  const [cacheStatus, setCacheStatus] = useState<CacheStatus>({});
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      console.log('📵 Service Worker: Not supported in this browser');
      return;
    }

    setSwState(prev => ({ ...prev, isSupported: true }));
    registerServiceWorker();
  }, []);

  const registerServiceWorker = async () => {
    try {
      console.log('🔧 Service Worker: Starting registration...');
      setSwState(prev => ({ ...prev, isInstalling: true }));

      const reg = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });

      setRegistration(reg);
      setSwState(prev => ({ 
        ...prev, 
        isRegistered: true, 
        isInstalling: false,
        isControlling: !!navigator.serviceWorker.controller
      }));

      console.log('✅ Service Worker: Registered successfully');

      // Handle different service worker states
      if (reg.installing) {
        console.log('🔧 Service Worker: Installing...');
        trackWorkerState(reg.installing);
      } else if (reg.waiting) {
        console.log('⏳ Service Worker: Waiting to activate...');
        setSwState(prev => ({ ...prev, isWaiting: true, hasUpdate: true }));
      } else if (reg.active) {
        console.log('✅ Service Worker: Active and controlling');
        setSwState(prev => ({ ...prev, isControlling: true }));
      }

      // Listen for updates
      reg.addEventListener('updatefound', () => {
        console.log('🔄 Service Worker: Update found');
        const newWorker = reg.installing;
        if (newWorker) {
          trackWorkerState(newWorker);
        }
      });

      // Check for controlling service worker changes
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 Service Worker: Controller changed');
        setSwState(prev => ({ ...prev, isControlling: true }));
        
        // Notify user about successful update
        toast.success('App updated successfully! 🎉', {
          description: 'You\'re now using the latest version.'
        });
      });

      // Initial cache status check
      await updateCacheStatus();

    } catch (error) {
      console.error('❌ Service Worker: Registration failed:', error);
      setSwState(prev => ({ ...prev, isInstalling: false }));
      
      // Only show error in development
      if (process.env.NODE_ENV === 'development') {
        toast.error('Service Worker registration failed', {
          description: 'Check console for details'
        });
      }
    }
  };

  const trackWorkerState = (worker: ServiceWorker) => {
    worker.addEventListener('statechange', () => {
      console.log('🔄 Service Worker state changed:', worker.state);
      
      switch (worker.state) {
        case 'installed':
          if (navigator.serviceWorker.controller) {
            // New worker is waiting to take over
            setSwState(prev => ({ ...prev, isWaiting: true, hasUpdate: true }));
            
            toast.info('App update available! 📥', {
              description: 'Click to restart and get the latest features.',
              action: {
                label: 'Update',
                onClick: () => updateServiceWorker()
              },
              duration: 10000
            });
          } else {
            // First install
            setSwState(prev => ({ ...prev, isControlling: true }));
            console.log('✅ Service Worker: Installed and ready');
          }
          break;
          
        case 'activated':
          setSwState(prev => ({ 
            ...prev, 
            isWaiting: false, 
            hasUpdate: false,
            isControlling: true 
          }));
          console.log('✅ Service Worker: Activated');
          break;
      }
    });
  };

  const updateServiceWorker = async () => {
    if (!registration || !registration.waiting) return;

    try {
      // Tell the waiting worker to skip waiting and become active
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Wait a bit and reload the page
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('❌ Service Worker: Update failed:', error);
    }
  };

  const updateCacheStatus = async () => {
    if (!navigator.serviceWorker.controller) return;

    try {
      const messageChannel = new MessageChannel();
      
      return new Promise<void>((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          if (event.data.type === 'CACHE_STATUS') {
            setCacheStatus(event.data.data);
          }
          resolve();
        };

        navigator.serviceWorker.controller?.postMessage(
          { type: 'GET_CACHE_STATUS' },
          [messageChannel.port2]
        );
      });
    } catch (error) {
      console.error('Service Worker: Failed to get cache status:', error);
    }
  };

  const clearCache = async (cacheType: string = 'all') => {
    if (!navigator.serviceWorker.controller) return;

    try {
      navigator.serviceWorker.controller?.postMessage({
        type: 'CLEAR_CACHE',
        data: { cacheType }
      });

      await updateCacheStatus();
      
      toast.success('Cache cleared successfully! 🗑️', {
        description: 'Fresh data will be loaded on next request.'
      });
    } catch (error) {
      console.error('Service Worker: Failed to clear cache:', error);
      toast.error('Failed to clear cache');
    }
  };

  // Queue offline action for background sync
  const queueOfflineAction = (action: any) => {
    if (!navigator.serviceWorker.controller) return;

    navigator.serviceWorker.controller?.postMessage({
      type: 'QUEUE_OFFLINE_ACTION',
      data: action
    });
  };

  // Expose functions globally for use in other components
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).adaptoniaSW = {
        updateCacheStatus,
        clearCache,
        queueOfflineAction,
        updateServiceWorker,
        state: swState,
        cacheStatus
      };
    }
  }, [swState, cacheStatus]);

  // Development-only cache status display
//   if (process.env.NODE_ENV === 'development' && swState.isSupported) {
//     return (
//       <div className="fixed bottom-4 left-4 z-50 bg-black text-white text-xs p-3 rounded-lg max-w-xs">
//         <div className="font-bold mb-2">Service Worker Status</div>
//         <div className="space-y-1">
//           <div>Registered: {swState.isRegistered ? '✅' : '❌'}</div>
//           <div>Controlling: {swState.isControlling ? '✅' : '❌'}</div>
//           <div>Update Available: {swState.hasUpdate ? '🔄' : '✅'}</div>
//           <div>Caches: {Object.keys(cacheStatus).length}</div>
//         </div>
        
//         {swState.hasUpdate && (
//           <button 
//             onClick={updateServiceWorker}
//             className="mt-2 bg-blue-500 px-2 py-1 rounded text-xs hover:bg-blue-600"
//           >
//             Update Now
//           </button>
//         )}
        
//         <button 
//           onClick={() => clearCache()}
//           className="mt-1 bg-red-500 px-2 py-1 rounded text-xs hover:bg-red-600 w-full"
//         >
//           Clear Cache
//         </button>
        
//         <button 
//           onClick={updateCacheStatus}
//           className="mt-1 bg-green-500 px-2 py-1 rounded text-xs hover:bg-green-600 w-full"
//         >
//           Refresh Status
//         </button>
//       </div>
//     );
//   }

  return null;
};

export default ServiceWorkerRegistration; 