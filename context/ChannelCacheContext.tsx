'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { UserChannelInfo, Channel } from '../types/channel';

// Cache configuration
const CACHE_CONFIG = {
  USER_CHANNELS_KEY: 'adaptonia_user_channels',
  PUBLIC_CHANNELS_KEY: 'adaptonia_public_channels',
  CACHE_METADATA_KEY: 'adaptonia_channels_metadata',
  TTL: 5 * 60 * 1000, // 5 minutes in milliseconds
  STALE_WHILE_REVALIDATE: 30 * 60 * 1000, // 30 minutes for stale-while-revalidate
};

interface CacheMetadata {
  userChannels: {
    timestamp: number;
    userId: string;
    hash?: string;
  };
  publicChannels: {
    timestamp: number;
    hash?: string;
  };
}

interface CacheState {
  userChannels: UserChannelInfo[];
  publicChannels: Channel[];
  isLoading: boolean;
  isFresh: boolean;
  lastUpdated: number | null;
  error: string | null;
}

type CacheAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER_CHANNELS'; payload: { channels: UserChannelInfo[]; userId: string } }
  | { type: 'SET_PUBLIC_CHANNELS'; payload: Channel[] }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'INVALIDATE_CACHE' }
  | { type: 'MARK_STALE' }
  | { type: 'HYDRATE_FROM_CACHE'; payload: { userChannels: UserChannelInfo[]; publicChannels: Channel[] } };

interface ChannelCacheContextType extends CacheState {
  setUserChannels: (channels: UserChannelInfo[], userId: string) => void;
  setPublicChannels: (channels: Channel[]) => void;
  getUserChannels: (userId: string) => UserChannelInfo[] | null;
  getPublicChannels: () => Channel[] | null;
  isDataStale: (type: 'user' | 'public', userId?: string) => boolean;
  shouldRefetch: (type: 'user' | 'public', userId?: string) => boolean;
  invalidateCache: (type?: 'user' | 'public' | 'all') => void;
  clearCache: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const initialState: CacheState = {
  userChannels: [],
  publicChannels: [],
  isLoading: false,
  isFresh: false,
  lastUpdated: null,
  error: null,
};

function cacheReducer(state: CacheState, action: CacheAction): CacheState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_USER_CHANNELS':
      return {
        ...state,
        userChannels: action.payload.channels,
        isFresh: true,
        lastUpdated: Date.now(),
        error: null,
      };
    
    case 'SET_PUBLIC_CHANNELS':
      return {
        ...state,
        publicChannels: action.payload,
        isFresh: true,
        lastUpdated: Date.now(),
        error: null,
      };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'INVALIDATE_CACHE':
      return { ...state, isFresh: false };
    
    case 'MARK_STALE':
      return { ...state, isFresh: false };
    
    case 'HYDRATE_FROM_CACHE':
      return {
        ...state,
        userChannels: action.payload.userChannels,
        publicChannels: action.payload.publicChannels,
        isFresh: false, // Mark as potentially stale
      };
    
    default:
      return state;
  }
}

// Utility functions for localStorage operations
const getCacheMetadata = (): CacheMetadata => {
  if (typeof window === 'undefined') {
    return { userChannels: { timestamp: 0, userId: '' }, publicChannels: { timestamp: 0 } };
  }
  
  try {
    const stored = localStorage.getItem(CACHE_CONFIG.CACHE_METADATA_KEY);
    return stored ? JSON.parse(stored) : { userChannels: { timestamp: 0, userId: '' }, publicChannels: { timestamp: 0 } };
  } catch {
    return { userChannels: { timestamp: 0, userId: '' }, publicChannels: { timestamp: 0 } };
  }
};

const setCacheMetadata = (metadata: CacheMetadata) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(CACHE_CONFIG.CACHE_METADATA_KEY, JSON.stringify(metadata));
  } catch (error) {
    console.warn('Failed to save cache metadata:', error);
  }
};

const getFromLocalStorage = function<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const setToLocalStorage = function<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn(`Failed to save to localStorage (${key}):`, error);
  }
};

// Create hash for data integrity checking
const createDataHash = (data: any): string => {
  if (typeof window === 'undefined') return '';
  return btoa(JSON.stringify(data)).slice(0, 32);
};

const ChannelCacheContext = createContext<ChannelCacheContextType | null>(null);

export const useChannelCache = () => {
  const context = useContext(ChannelCacheContext);
  if (!context) {
    throw new Error('useChannelCache must be used within a ChannelCacheProvider');
  }
  return context;
};

interface ChannelCacheProviderProps {
  children: ReactNode;
}

export const ChannelCacheProvider: React.FC<ChannelCacheProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(cacheReducer, initialState);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const hydrateFromCache = () => {
      const userChannels = getFromLocalStorage<UserChannelInfo[]>(CACHE_CONFIG.USER_CHANNELS_KEY) || [];
      const publicChannels = getFromLocalStorage<Channel[]>(CACHE_CONFIG.PUBLIC_CHANNELS_KEY) || [];
      
      if (userChannels.length > 0 || publicChannels.length > 0) {
        dispatch({
          type: 'HYDRATE_FROM_CACHE',
          payload: { userChannels, publicChannels }
        });
      }
    };

    hydrateFromCache();
  }, []);

  // Set user channels with caching
  const setUserChannels = useCallback((channels: UserChannelInfo[], userId: string) => {
    dispatch({ type: 'SET_USER_CHANNELS', payload: { channels, userId } });
    
    // Cache to localStorage
    setToLocalStorage(CACHE_CONFIG.USER_CHANNELS_KEY, channels);
    
    // Update metadata
    const metadata = getCacheMetadata();
    metadata.userChannels = {
      timestamp: Date.now(),
      userId,
      hash: createDataHash(channels),
    };
    setCacheMetadata(metadata);
  }, []);

  // Set public channels with caching
  const setPublicChannels = useCallback((channels: Channel[]) => {
    dispatch({ type: 'SET_PUBLIC_CHANNELS', payload: channels });
    
    // Cache to localStorage
    setToLocalStorage(CACHE_CONFIG.PUBLIC_CHANNELS_KEY, channels);
    
    // Update metadata
    const metadata = getCacheMetadata();
    metadata.publicChannels = {
      timestamp: Date.now(),
      hash: createDataHash(channels),
    };
    setCacheMetadata(metadata);
  }, []);

  // Get user channels from cache
  const getUserChannels = useCallback((userId: string): UserChannelInfo[] | null => {
    const metadata = getCacheMetadata();
    
    // Check if cache is for the right user
    if (metadata.userChannels.userId !== userId) {
      return null;
    }
    
    // Check if data is too old
    if (Date.now() - metadata.userChannels.timestamp > CACHE_CONFIG.STALE_WHILE_REVALIDATE) {
      return null;
    }
    
    return getFromLocalStorage<UserChannelInfo[]>(CACHE_CONFIG.USER_CHANNELS_KEY);
  }, []);

  // Get public channels from cache
  const getPublicChannels = useCallback((): Channel[] | null => {
    const metadata = getCacheMetadata();
    
    // Check if data is too old
    if (Date.now() - metadata.publicChannels.timestamp > CACHE_CONFIG.STALE_WHILE_REVALIDATE) {
      return null;
    }
    
    return getFromLocalStorage<Channel[]>(CACHE_CONFIG.PUBLIC_CHANNELS_KEY);
  }, []);

  // Check if data is stale
  const isDataStale = useCallback((type: 'user' | 'public', userId?: string): boolean => {
    const metadata = getCacheMetadata();
    const now = Date.now();
    
    if (type === 'user') {
      return (
        !userId ||
        metadata.userChannels.userId !== userId ||
        now - metadata.userChannels.timestamp > CACHE_CONFIG.TTL
      );
    } else {
      return now - metadata.publicChannels.timestamp > CACHE_CONFIG.TTL;
    }
  }, []);

  // Check if should refetch (for stale-while-revalidate)
  const shouldRefetch = useCallback((type: 'user' | 'public', userId?: string): boolean => {
    const metadata = getCacheMetadata();
    const now = Date.now();
    
    if (type === 'user') {
      return (
        !userId ||
        metadata.userChannels.userId !== userId ||
        now - metadata.userChannels.timestamp > CACHE_CONFIG.TTL
      );
    } else {
      return now - metadata.publicChannels.timestamp > CACHE_CONFIG.TTL;
    }
  }, []);

  // Invalidate cache
  const invalidateCache = useCallback((type: 'user' | 'public' | 'all' = 'all') => {
    if (typeof window === 'undefined') return;
    
    if (type === 'all' || type === 'user') {
      localStorage.removeItem(CACHE_CONFIG.USER_CHANNELS_KEY);
    }
    if (type === 'all' || type === 'public') {
      localStorage.removeItem(CACHE_CONFIG.PUBLIC_CHANNELS_KEY);
    }
    if (type === 'all') {
      localStorage.removeItem(CACHE_CONFIG.CACHE_METADATA_KEY);
    }
    
    dispatch({ type: 'INVALIDATE_CACHE' });
  }, []);

  // Clear all cache
  const clearCache = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(CACHE_CONFIG.USER_CHANNELS_KEY);
    localStorage.removeItem(CACHE_CONFIG.PUBLIC_CHANNELS_KEY);
    localStorage.removeItem(CACHE_CONFIG.CACHE_METADATA_KEY);
    
    dispatch({ type: 'INVALIDATE_CACHE' });
  }, []);

  // Set loading state
  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  // Set error state
  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  // Auto-cleanup stale cache on visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (typeof window === 'undefined') return;
      
      if (document.visibilityState === 'visible') {
        const metadata = getCacheMetadata();
        const now = Date.now();
        
        // Clean up very old cache
        if (now - metadata.userChannels.timestamp > CACHE_CONFIG.STALE_WHILE_REVALIDATE) {
          localStorage.removeItem(CACHE_CONFIG.USER_CHANNELS_KEY);
        }
        if (now - metadata.publicChannels.timestamp > CACHE_CONFIG.STALE_WHILE_REVALIDATE) {
          localStorage.removeItem(CACHE_CONFIG.PUBLIC_CHANNELS_KEY);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const contextValue: ChannelCacheContextType = {
    ...state,
    setUserChannels,
    setPublicChannels,
    getUserChannels,
    getPublicChannels,
    isDataStale,
    shouldRefetch,
    invalidateCache,
    clearCache,
    setLoading,
    setError,
  };

  return (
    <ChannelCacheContext.Provider value={contextValue}>
      {children}
    </ChannelCacheContext.Provider>
  );
}; 