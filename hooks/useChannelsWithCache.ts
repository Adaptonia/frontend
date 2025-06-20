import { useState, useEffect, useCallback, useRef } from 'react';
import { Client } from 'appwrite';
import channelService from '../services/channelService';
import { useChannelCache } from '../context/ChannelCacheContext';
import {
  Channel,
  UserChannelInfo,
  CreateChannelData,
  ApiResponse,
} from '../types/channel';

interface UseChannelsWithCacheState {
  userChannels: UserChannelInfo[];
  publicChannels: Channel[];
  isLoading: boolean;
  isCreating: boolean;
  isJoining: string | null;
  isLeaving: string | null;
  error: string | null;
  isRefreshing: boolean; // For background updates
  isCacheHit: boolean; // Indicates if data came from cache
}

interface UseChannelsWithCacheActions {
  fetchUserChannels: (forceRefresh?: boolean) => Promise<void>;
  fetchPublicChannels: (forceRefresh?: boolean) => Promise<void>;
  createChannel: (channelData: CreateChannelData) => Promise<boolean>;
  joinChannel: (channelId: string) => Promise<boolean>;
  leaveChannel: (channelId: string) => Promise<boolean>;
  clearError: () => void;
  refreshChannels: (forceRefresh?: boolean) => Promise<void>;
  invalidateAndRefresh: () => Promise<void>;
}

export interface UseChannelsWithCacheReturn extends UseChannelsWithCacheState, UseChannelsWithCacheActions {}

export const useChannelsWithCache = (userId?: string): UseChannelsWithCacheReturn => {
  const cache = useChannelCache();
  
  const [state, setState] = useState<UseChannelsWithCacheState>({
    userChannels: [],
    publicChannels: [],
    isLoading: false,
    isCreating: false,
    isJoining: null,
    isLeaving: null,
    error: null,
    isRefreshing: false,
    isCacheHit: false,
  });

  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);
  
  // Initialize Appwrite client for realtime subscriptions
  const client = new Client();
  client
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '');

  // Background refresh flag to prevent multiple simultaneous refreshes
  const isBackgroundRefreshingRef = useRef<{ user: boolean; public: boolean }>({
    user: false,
    public: false,
  });

  // Safe state update that checks if component is mounted
  const safeSetState = useCallback((updater: (prev: UseChannelsWithCacheState) => UseChannelsWithCacheState) => {
    if (isMountedRef.current) {
      setState(updater);
    }
  }, []);

  // Fetch user's channels with cache-first strategy
  const fetchUserChannels = useCallback(async (forceRefresh: boolean = false) => {
    if (!userId) return;

    // Try cache first unless force refresh
    if (!forceRefresh) {
      const cachedChannels = cache.getUserChannels(userId);
      if (cachedChannels) {
        safeSetState(prev => ({
          ...prev,
          userChannels: cachedChannels,
          isCacheHit: true,
          isLoading: false, // Ensure loading is false for cached data
          error: null,
        }));

        // Background refresh if data is stale
        if (cache.shouldRefetch('user', userId) && !isBackgroundRefreshingRef.current.user) {
          isBackgroundRefreshingRef.current.user = true;
          safeSetState(prev => ({ ...prev, isRefreshing: true }));
          
          try {
            const response = await channelService.getUserChannels(userId);
            if (response.success && response.data && isMountedRef.current) {
              cache.setUserChannels(response.data, userId);
              safeSetState(prev => ({
                ...prev,
                userChannels: response.data || [],
                isRefreshing: false,
                isCacheHit: false,
              }));
            }
          } catch (error) {
            console.warn('Background refresh failed for user channels:', error);
          } finally {
            isBackgroundRefreshingRef.current.user = false;
            safeSetState(prev => ({ ...prev, isRefreshing: false }));
          }
        }
        return;
      }
    }

    // No cache or force refresh - show loading
    safeSetState(prev => ({ ...prev, isLoading: true, error: null, isCacheHit: false }));

    try {
      const response = await channelService.getUserChannels(userId);
      
      if (response.success && response.data && isMountedRef.current) {
        cache.setUserChannels(response.data, userId);
        safeSetState(prev => ({
          ...prev,
          userChannels: response.data || [],
          isLoading: false,
        }));
      } else if (isMountedRef.current) {
        safeSetState(prev => ({
          ...prev,
          error: response.error || 'Failed to fetch channels',
          isLoading: false,
        }));
      }
    } catch (error) {
      if (isMountedRef.current) {
        safeSetState(prev => ({
          ...prev,
          error: 'An unexpected error occurred',
          isLoading: false,
        }));
      }
    }
  }, [userId, cache, safeSetState]);

  // Fetch public channels with cache-first strategy
  const fetchPublicChannels = useCallback(async (forceRefresh: boolean = false) => {
    // Try cache first unless force refresh
    if (!forceRefresh) {
      const cachedChannels = cache.getPublicChannels();
      if (cachedChannels) {
        safeSetState(prev => ({
          ...prev,
          publicChannels: cachedChannels,
          isCacheHit: true,
          isLoading: false, // Ensure loading is false for cached data
          error: null,
        }));

        // Background refresh if data is stale
        if (cache.shouldRefetch('public') && !isBackgroundRefreshingRef.current.public) {
          isBackgroundRefreshingRef.current.public = true;
          safeSetState(prev => ({ ...prev, isRefreshing: true }));
          
          try {
            const response = await channelService.getPublicChannels();
            if (response.success && response.data && isMountedRef.current) {
              cache.setPublicChannels(response.data.documents || []);
              safeSetState(prev => ({
                ...prev,
                publicChannels: response.data?.documents || [],
                isRefreshing: false,
                isCacheHit: false,
              }));
            }
          } catch (error) {
            console.warn('Background refresh failed for public channels:', error);
          } finally {
            isBackgroundRefreshingRef.current.public = false;
            safeSetState(prev => ({ ...prev, isRefreshing: false }));
          }
        }
        return;
      }
    }

    // No cache or force refresh - show loading
    safeSetState(prev => ({ ...prev, isLoading: true, error: null, isCacheHit: false }));

    try {
      const response = await channelService.getPublicChannels();
      
      if (response.success && response.data && isMountedRef.current) {
        cache.setPublicChannels(response.data.documents || []);
        safeSetState(prev => ({
          ...prev,
          publicChannels: response.data?.documents || [],
          isLoading: false,
        }));
      } else if (isMountedRef.current) {
        safeSetState(prev => ({
          ...prev,
          error: response.error || 'Failed to fetch channels',
          isLoading: false,
        }));
      }
    } catch (error) {
      if (isMountedRef.current) {
        safeSetState(prev => ({
          ...prev,
          error: 'An unexpected error occurred',
          isLoading: false,
        }));
      }
    }
  }, [cache, safeSetState]);

  // Create new channel
  const createChannel = useCallback(async (channelData: CreateChannelData): Promise<boolean> => {
    if (!userId) {
      safeSetState(prev => ({ ...prev, error: 'User not authenticated' }));
      return false;
    }

    safeSetState(prev => ({ ...prev, isCreating: true, error: null }));

    try {
      const response = await channelService.createChannel(channelData, userId);
      
      if (response.success && response.data && isMountedRef.current) {
        // Optimistic update - add to user channels immediately
        const newUserChannel: UserChannelInfo = {
          channel: response.data,
          member: {
            $id: '',
            channelId: response.data.$id,
            userId,
            role: 'admin',
            isActive: true,
            lastActiveAt: new Date().toISOString(),
            $createdAt: new Date().toISOString(),
            $updatedAt: new Date().toISOString()
          },
          unreadCount: 0
        };

        safeSetState(prev => ({
          ...prev,
          userChannels: [newUserChannel, ...prev.userChannels],
          isCreating: false
        }));

        // Update cache
        const updatedUserChannels = [newUserChannel, ...state.userChannels];
        cache.setUserChannels(updatedUserChannels, userId);

        // Refresh public channels if it's a public channel
        if (channelData.type === 'public') {
          fetchPublicChannels(true); // Force refresh for public channels
        }

        return true;
      } else if (isMountedRef.current) {
        safeSetState(prev => ({
          ...prev,
          error: response.error || 'Failed to create channel',
          isCreating: false,
        }));
        return false;
      }
    } catch (error) {
      if (isMountedRef.current) {
        safeSetState(prev => ({
          ...prev,
          error: 'An unexpected error occurred',
          isCreating: false,
        }));
      }
      return false;
    }
    return false;
  }, [userId, state.userChannels, cache, fetchPublicChannels, safeSetState]);

  // Join channel
  const joinChannel = useCallback(async (channelId: string): Promise<boolean> => {
    if (!userId) {
      safeSetState(prev => ({ ...prev, error: 'User not authenticated' }));
      return false;
    }

    safeSetState(prev => ({ ...prev, isJoining: channelId, error: null }));

    try {
      const response = await channelService.joinChannel(channelId, userId);
      
      if (response.success && isMountedRef.current) {
        // Invalidate cache and refresh to get accurate data
        cache.invalidateCache('user');
        await fetchUserChannels(true);
        await fetchPublicChannels(true); // Update member counts

        safeSetState(prev => ({ ...prev, isJoining: null }));
        return true;
      } else if (isMountedRef.current) {
        safeSetState(prev => ({
          ...prev,
          error: response.error || 'Failed to join channel',
          isJoining: null,
        }));
        return false;
      }
    } catch (error) {
      if (isMountedRef.current) {
        safeSetState(prev => ({
          ...prev,
          error: 'An unexpected error occurred',
          isJoining: null,
        }));
      }
      return false;
    }
    return false;
  }, [userId, cache, fetchUserChannels, fetchPublicChannels, safeSetState]);

  // Leave channel
  const leaveChannel = useCallback(async (channelId: string): Promise<boolean> => {
    if (!userId) {
      safeSetState(prev => ({ ...prev, error: 'User not authenticated' }));
      return false;
    }

    safeSetState(prev => ({ ...prev, isLeaving: channelId, error: null }));

    try {
      const response = await channelService.leaveChannel(channelId, userId);
      
      if (response.success && isMountedRef.current) {
        // Optimistic update - remove from user channels
        const updatedUserChannels = state.userChannels.filter(uc => uc.channel.$id !== channelId);
        safeSetState(prev => ({
          ...prev,
          userChannels: updatedUserChannels,
          isLeaving: null,
        }));

        // Update cache
        cache.setUserChannels(updatedUserChannels, userId);

        // Update public channels member counts
        await fetchPublicChannels(true);
        return true;
      } else if (isMountedRef.current) {
        safeSetState(prev => ({
          ...prev,
          error: response.error || 'Failed to leave channel',
          isLeaving: null,
        }));
        return false;
      }
    } catch (error) {
      if (isMountedRef.current) {
        safeSetState(prev => ({
          ...prev,
          error: 'An unexpected error occurred',
          isLeaving: null,
        }));
      }
      return false;
    }
    return false;
  }, [userId, state.userChannels, cache, fetchPublicChannels, safeSetState]);

  // Clear error
  const clearError = useCallback(() => {
    safeSetState(prev => ({ ...prev, error: null }));
  }, [safeSetState]);

  // Refresh all channels
  const refreshChannels = useCallback(async (forceRefresh: boolean = false) => {
    await Promise.all([
      fetchUserChannels(forceRefresh),
      fetchPublicChannels(forceRefresh)
    ]);
  }, [fetchUserChannels, fetchPublicChannels]);

  // Invalidate cache and force refresh
  const invalidateAndRefresh = useCallback(async () => {
    cache.invalidateCache();
    await refreshChannels(true);
  }, [cache, refreshChannels]);

  // Subscribe to channel membership changes
  useEffect(() => {
    if (!userId) return;

    const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'main';
    const CHANNEL_MEMBERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_CHANNEL_MEMBERS_COLLECTION_ID || 'channel-members';

    // Subscribe to channel member changes for this user
    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.${CHANNEL_MEMBERS_COLLECTION_ID}.documents`,
      (response) => {
        const events = response.events || [];
        
        // Check if this event is related to the current user
        const payload = response.payload as any;
        if (payload?.userId === userId) {
          // Invalidate user channels cache and refresh
          cache.invalidateCache('user');
          fetchUserChannels(true);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [userId, cache, fetchUserChannels, client]);

  // Subscribe to channel changes for public channels
  useEffect(() => {
    const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'main';
    const CHANNELS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_CHANNELS_COLLECTION_ID || 'channels';

    // Subscribe to channel changes
    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.${CHANNELS_COLLECTION_ID}.documents`,
      (response) => {
        // Invalidate public channels cache and refresh
        cache.invalidateCache('public');
        fetchPublicChannels(true);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [cache, fetchPublicChannels, client]);

  // Initial data fetch
  useEffect(() => {
    if (userId) {
      fetchUserChannels();
    }
    fetchPublicChannels();
  }, [userId, fetchUserChannels, fetchPublicChannels]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    ...state,
    fetchUserChannels,
    fetchPublicChannels,
    createChannel,
    joinChannel,
    leaveChannel,
    clearError,
    refreshChannels,
    invalidateAndRefresh,
  };
}; 
