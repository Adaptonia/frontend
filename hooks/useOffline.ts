'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface OfflineState {
  isOnline: boolean;
  isServiceWorkerSupported: boolean;
  isServiceWorkerRegistered: boolean;
  hasServiceWorkerUpdate: boolean;
  cacheSize: number;
}

interface OfflineAction {
  id?: string;
  type: string;
  url: string;
  method?: string;
  data?: any;
  headers?: Record<string, string>;
  timestamp?: number;
}

export const useOffline = () => {
  const [state, setState] = useState<OfflineState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isServiceWorkerSupported: typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
    isServiceWorkerRegistered: false,
    hasServiceWorkerUpdate: false,
    cacheSize: 0
  });

  const [offlineQueue, setOfflineQueue] = useState<OfflineAction[]>([]);

  useEffect(() => {
    // Listen for online/offline events
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      
      // Show toast when coming back online
      toast.success('🌐 Back online!', {
        description: 'Syncing your offline changes...'
      });
      
      // Trigger background sync if service worker is available
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then(registration => {
          if ('sync' in registration) {
            (registration as any).sync.register('offline-queue');
          }
        });
      }
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
      
      toast.warning('📱 You\'re offline', {
        description: 'Your changes will be saved and synced when you\'re back online.'
      });
    };

    // Check service worker status
    const checkServiceWorkerStatus = () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(() => {
          setState(prev => ({ ...prev, isServiceWorkerRegistered: true }));
        });

        // Check for updates
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          setState(prev => ({ ...prev, hasServiceWorkerUpdate: true }));
        });
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    checkServiceWorkerStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Queue action for offline sync
  const queueAction = useCallback((action: OfflineAction) => {
    const actionWithId = {
      ...action,
      id: action.id || `${Date.now()}-${Math.random()}`,
      timestamp: action.timestamp || Date.now()
    };

    setOfflineQueue(prev => [...prev, actionWithId]);

    // Send to service worker if available
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'QUEUE_OFFLINE_ACTION',
        data: actionWithId
      });
    } else {
      // Fallback: store in localStorage
      try {
        const stored = localStorage.getItem('adaptonia_offline_queue');
        const queue = stored ? JSON.parse(stored) : [];
        queue.push(actionWithId);
        localStorage.setItem('adaptonia_offline_queue', JSON.stringify(queue));
      } catch (error) {
        console.error('Failed to store offline action:', error);
      }
    }

    console.log('📤 Queued offline action:', actionWithId.type);
  }, []);

  // Remove action from queue
  const removeFromQueue = useCallback((actionId: string) => {
    setOfflineQueue(prev => prev.filter(action => action.id !== actionId));
  }, []);

  // Clear all queued actions
  const clearQueue = useCallback(() => {
    setOfflineQueue([]);
    
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CLEAR_OFFLINE_QUEUE'
      });
    }
    
    localStorage.removeItem('adaptonia_offline_queue');
  }, []);

  // Manual sync trigger
  const triggerSync = useCallback(async () => {
    if (!state.isOnline) {
      toast.error('Cannot sync while offline');
      return;
    }

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if ('sync' in registration) {
          await (registration as any).sync.register('offline-queue');
          toast.success('Sync triggered');
        }
      } catch (error) {
        console.error('Failed to trigger sync:', error);
        toast.error('Sync failed');
      }
    }
  }, [state.isOnline]);

  // Cache management
  const clearCache = useCallback(async (cacheType: string = 'all') => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CLEAR_CACHE',
        data: { cacheType }
      });
      
      toast.success('Cache cleared');
    }
  }, []);

  // Get cache status
  const getCacheStatus = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
      return {};
    }

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data.type === 'CACHE_STATUS') {
          const status = event.data.data;
          const totalSize = Object.values(status).reduce((sum: number, cache: any) => sum + cache.size, 0);
          setState(prev => ({ ...prev, cacheSize: totalSize }));
          resolve(status);
        }
      };

      navigator.serviceWorker.controller?.postMessage(
        { type: 'GET_CACHE_STATUS' },
        [messageChannel.port2]
      );
    });
  }, []);

  // Enhanced fetch with offline support
  const offlineFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    try {
      // Try network request first
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return response;
    } catch (error) {
      console.log('Network request failed, checking cache:', url);
      
      // If offline or network failed, try to get from cache via service worker
      if ('caches' in window) {
        const cache = await caches.open('adaptonia-api-v1.0.0');
        const cachedResponse = await cache.match(url);
        
        if (cachedResponse) {
          console.log('✅ Serving from cache:', url);
          return cachedResponse;
        }
      }
      
      // If not cached and we're offline, queue the action
      if (!state.isOnline && options.method && options.method !== 'GET') {
        queueAction({
          type: 'FAILED_REQUEST',
          url,
          method: options.method,
          data: options.body,
          headers: options.headers as Record<string, string>
        });
        
        toast.info('Request queued for when you\'re back online');
      }
      
      throw error;
    }
  }, [state.isOnline, queueAction]);

  return {
    // State
    ...state,
    offlineQueue,
    
    // Actions
    queueAction,
    removeFromQueue,
    clearQueue,
    triggerSync,
    clearCache,
    getCacheStatus,
    offlineFetch,
    
    // Utilities
    isOffline: !state.isOnline,
    canSync: state.isOnline && state.isServiceWorkerRegistered,
    hasQueuedActions: offlineQueue.length > 0
  };
};

export default useOffline; 