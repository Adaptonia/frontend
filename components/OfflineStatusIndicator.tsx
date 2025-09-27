'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Download, Upload, RefreshCw, Database, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useOffline from '@/hooks/useOffline';

interface OfflineStatusIndicatorProps {
  showDetails?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const OfflineStatusIndicator: React.FC<OfflineStatusIndicatorProps> = ({
  showDetails = false,
  position = 'top-right'
}) => {
  const {
    isOnline,
    isServiceWorkerRegistered,
    hasQueuedActions,
    offlineQueue,
    cacheSize,
    triggerSync,
    clearCache,
    getCacheStatus
  } = useOffline();

  const [isExpanded, setIsExpanded] = useState(false);
  const [cacheStats, setCacheStats] = useState<any>({});
  const [isSyncing, setIsSyncing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isExpanded) {
      updateCacheStats();
    }
  }, [isExpanded]);

  const updateCacheStats = async () => {
    try {
      const stats = await getCacheStatus();
      setCacheStats(stats);
    } catch (error) {
      console.error('Failed to get cache stats:', error);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await triggerSync();
      setTimeout(() => setIsSyncing(false), 2000);
    } catch (error) {
      setIsSyncing(false);
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      default:
        return 'top-4 right-4';
    }
  };

  // Don't show if service worker isn't supported or not mounted yet
  if (!isMounted || (!isServiceWorkerRegistered && process.env.NODE_ENV === 'production')) {
    return null;
  }

  return (
    <div className={`fixed ${getPositionClasses()} z-50`}>
      <AnimatePresence>
        {/* Main indicator */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          className={`relative ${isExpanded ? 'mb-2' : ''}`}
        >
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex items-center gap-2 px-3 py-2 rounded-full text-white text-sm font-medium transition-all duration-200 ${
              isOnline 
                ? 'bg-green-500 hover:bg-green-600' 
                : 'bg-red-500 hover:bg-red-600 animate-pulse'
            }`}
          >
            {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
            <span className="hidden sm:inline">
              {isOnline ? 'Online' : 'Offline'}
            </span>
            
            {hasQueuedActions && (
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-2 h-2 bg-yellow-400 rounded-full"
              />
            )}
          </button>
        </motion.div>

        {/* Expanded details */}
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border p-4 min-w-80"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Connection Status
              </h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={16} />
              </button>
            </div>

            {/* Status indicators */}
            <div className="space-y-3">
              {/* Online/Offline status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isOnline ? (
                    <Wifi className="text-green-500" size={16} />
                  ) : (
                    <WifiOff className="text-red-500" size={16} />
                  )}
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Network
                  </span>
                </div>
                <span className={`text-sm font-medium ${
                  isOnline ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isOnline ? 'Connected' : 'Disconnected'}
                </span>
              </div>

              {/* Service Worker status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="text-blue-500" size={16} />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Offline Cache
                  </span>
                </div>
                <span className={`text-sm font-medium ${
                  isServiceWorkerRegistered ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {isServiceWorkerRegistered ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Queued actions */}
              {hasQueuedActions && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Upload className="text-yellow-500" size={16} />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Pending Sync
                    </span>
                  </div>
                  <span className="text-sm font-medium text-yellow-600">
                    {offlineQueue.length} action{offlineQueue.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}

              {/* Cache stats */}
              {Object.keys(cacheStats).length > 0 && (
                <div className="border-t pt-3 mt-3">
                  <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    CACHE STATUS
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(cacheStats).map(([cacheName, stats]: [string, any]) => (
                      <div key={cacheName} className="flex items-center justify-between">
                        <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {cacheName.replace('adaptonia-', '').replace('-v1.0.0', '')}
                        </span>
                        <span className="text-xs font-medium text-gray-500">
                          {stats.size} items
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 mt-4 pt-3 border-t">
              {hasQueuedActions && isOnline && (
                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 text-white text-xs rounded-md hover:bg-blue-600 disabled:opacity-50"
                >
                  <RefreshCw 
                    size={12} 
                    className={isSyncing ? 'animate-spin' : ''} 
                  />
                  {isSyncing ? 'Syncing...' : 'Sync Now'}
                </button>
              )}
              
              <button
                onClick={() => clearCache()}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-500 text-white text-xs rounded-md hover:bg-gray-600"
              >
                <Database size={12} />
                Clear Cache
              </button>
            </div>

            {/* Offline tip */}
            {!isOnline && (
              <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border-l-4 border-yellow-400">
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  💡 You can still browse cached content and create goals. Your changes will sync when you're back online.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OfflineStatusIndicator; 