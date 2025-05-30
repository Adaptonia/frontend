import { useState, useEffect, useCallback } from 'react'
import { Client } from 'appwrite'
import channelService from '../services/channelService'
import {
  Channel,
  UserChannelInfo,
  CreateChannelData,
  ApiResponse,
  PaginatedResponse
} from '../types/channel'

interface UseChannelsState {
  userChannels: UserChannelInfo[]
  publicChannels: Channel[]
  isLoading: boolean
  isCreating: boolean
  isJoining: string | null // channelId currently being joined
  isLeaving: string | null // channelId currently being left
  error: string | null
}

interface UseChannelsActions {
  fetchUserChannels: () => Promise<void>
  fetchPublicChannels: () => Promise<void>
  createChannel: (channelData: CreateChannelData) => Promise<boolean>
  joinChannel: (channelId: string) => Promise<boolean>
  leaveChannel: (channelId: string) => Promise<boolean>
  clearError: () => void
  refreshChannels: () => Promise<void>
}

export interface UseChannelsReturn extends UseChannelsState, UseChannelsActions {}

export const useChannels = (userId?: string): UseChannelsReturn => {
  const [state, setState] = useState<UseChannelsState>({
    userChannels: [],
    publicChannels: [],
    isLoading: false,
    isCreating: false,
    isJoining: null,
    isLeaving: null,
    error: null
  })

  // Initialize Appwrite client for realtime subscriptions
  const client = new Client()
  client
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')

  // Fetch user's channels
  const fetchUserChannels = useCallback(async () => {
    if (!userId) return

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await channelService.getUserChannels(userId)
      
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          userChannels: response.data || [],
          isLoading: false
        }))
      } else {
        setState(prev => ({
          ...prev,
          error: response.error || 'Failed to fetch channels',
          isLoading: false
        }))
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'An unexpected error occurred',
        isLoading: false
      }))
    }
  }, [userId])

  // Fetch public channels
  const fetchPublicChannels = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await channelService.getPublicChannels()
      
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          publicChannels: response.data?.documents || [],
          isLoading: false
        }))
      } else {
        setState(prev => ({
          ...prev,
          error: response.error || 'Failed to fetch public channels',
          isLoading: false
        }))
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'An unexpected error occurred',
        isLoading: false
      }))
    }
  }, [])

  // Create new channel
  const createChannel = useCallback(async (channelData: CreateChannelData): Promise<boolean> => {
    if (!userId) {
      setState(prev => ({ ...prev, error: 'User not authenticated' }))
      return false
    }

    setState(prev => ({ ...prev, isCreating: true, error: null }))

    try {
      const response = await channelService.createChannel(channelData, userId)
      
      if (response.success && response.data) {
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
        }

        setState(prev => ({
          ...prev,
          userChannels: [newUserChannel, ...prev.userChannels],
          isCreating: false
        }))

        // Refresh public channels if it's a public channel
        if (channelData.type === 'public') {
          fetchPublicChannels()
        }

        return true
      } else {
        setState(prev => ({
          ...prev,
          error: response.error || 'Failed to create channel',
          isCreating: false
        }))
        return false
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'An unexpected error occurred',
        isCreating: false
      }))
      return false
    }
  }, [userId, fetchPublicChannels])

  // Join channel
  const joinChannel = useCallback(async (channelId: string): Promise<boolean> => {
    if (!userId) {
      setState(prev => ({ ...prev, error: 'User not authenticated' }))
      return false
    }

    setState(prev => ({ ...prev, isJoining: channelId, error: null }))

    try {
      const response = await channelService.joinChannel(channelId, userId)
      
      if (response.success) {
        // Refresh user channels to get the updated list
        await fetchUserChannels()
        await fetchPublicChannels() // Update member counts

        setState(prev => ({ ...prev, isJoining: null }))
        return true
      } else {
        setState(prev => ({
          ...prev,
          error: response.error || 'Failed to join channel',
          isJoining: null
        }))
        return false
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'An unexpected error occurred',
        isJoining: null
      }))
      return false
    }
  }, [userId, fetchUserChannels, fetchPublicChannels])

  // Leave channel
  const leaveChannel = useCallback(async (channelId: string): Promise<boolean> => {
    if (!userId) {
      setState(prev => ({ ...prev, error: 'User not authenticated' }))
      return false
    }

    setState(prev => ({ ...prev, isLeaving: channelId, error: null }))

    try {
      const response = await channelService.leaveChannel(channelId, userId)
      
      if (response.success) {
        // Optimistic update - remove from user channels
        setState(prev => ({
          ...prev,
          userChannels: prev.userChannels.filter(uc => uc.channel.$id !== channelId),
          isLeaving: null
        }))

        // Update public channels member counts
        await fetchPublicChannels()
        return true
      } else {
        setState(prev => ({
          ...prev,
          error: response.error || 'Failed to leave channel',
          isLeaving: null
        }))
        return false
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'An unexpected error occurred',
        isLeaving: null
      }))
      return false
    }
  }, [userId, fetchPublicChannels])

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // Refresh all channels
  const refreshChannels = useCallback(async () => {
    await Promise.all([
      fetchUserChannels(),
      fetchPublicChannels()
    ])
  }, [fetchUserChannels, fetchPublicChannels])

  // Subscribe to channel membership changes
  useEffect(() => {
    if (!userId) return

    const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'main'
    const CHANNEL_MEMBERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_CHANNEL_MEMBERS_COLLECTION_ID || 'channel-members'

    // Subscribe to channel member changes for this user
    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.${CHANNEL_MEMBERS_COLLECTION_ID}.documents`,
      (response) => {
        const events = response.events || []
        
        // Check if this event is related to the current user
        const payload = response.payload as any
        if (payload?.userId === userId) {
          // Refresh user channels when membership changes
          fetchUserChannels()
        }
      }
    )

    return () => {
      unsubscribe()
    }
  }, [userId, fetchUserChannels, client])

  // Subscribe to channel changes for public channels
  useEffect(() => {
    const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'main'
    const CHANNELS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_CHANNELS_COLLECTION_ID || 'channels'

    // Subscribe to channel changes
    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.${CHANNELS_COLLECTION_ID}.documents`,
      (response) => {
        // Refresh public channels when channels are created/updated
        fetchPublicChannels()
      }
    )

    return () => {
      unsubscribe()
    }
  }, [fetchPublicChannels, client])

  // Initial data fetch
  useEffect(() => {
    if (userId) {
      fetchUserChannels()
    }
    fetchPublicChannels()
  }, [userId, fetchUserChannels, fetchPublicChannels])

  return {
    ...state,
    fetchUserChannels,
    fetchPublicChannels,
    createChannel,
    joinChannel,
    leaveChannel,
    clearError,
    refreshChannels
  }
} 