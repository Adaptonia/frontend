import { useState, useEffect, useCallback, useRef } from 'react'
import { Client } from 'appwrite'
import channelService from '../services/channelService'
import {
  MessageWithSender,
  SendMessageData,
  ApiResponse
} from '../types/channel'

interface UseChannelMessagesState {
  messages: MessageWithSender[]
  isLoading: boolean
  isSending: boolean
  isLoadingMore: boolean
  hasMore: boolean
  error: string | null
  lastReadMessageId?: string
}

interface UseChannelMessagesActions {
  sendMessage: (messageData: SendMessageData) => Promise<boolean>
  loadMoreMessages: () => Promise<void>
  markAsRead: (messageId: string) => void
  clearError: () => void
  refreshMessages: () => Promise<void>
}

export interface UseChannelMessagesReturn extends UseChannelMessagesState, UseChannelMessagesActions {}

export const useChannelMessages = (
  channelId: string | null, 
  userId?: string,
  limit: number = 50
): UseChannelMessagesReturn => {
  const [state, setState] = useState<UseChannelMessagesState>({
    messages: [],
    isLoading: false,
    isSending: false,
    isLoadingMore: false,
    hasMore: true,
    error: null,
    lastReadMessageId: undefined
  })

  const currentChannelId = useRef<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize Appwrite client for realtime subscriptions
  const client = new Client()
  client
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')

  // Fetch messages for a channel
  const fetchMessages = useCallback(async (isLoadingMore = false) => {
    if (!channelId) return

    setState(prev => ({ 
      ...prev, 
      isLoading: !isLoadingMore,
      isLoadingMore,
      error: null 
    }))

    try {
      const response = await channelService.getChannelMessages(channelId, limit)
      
      if (response.success && response.data) {
        const newMessages = response.data

        setState(prev => ({
          ...prev,
          messages: isLoadingMore 
            ? [...newMessages, ...prev.messages] 
            : newMessages,
          hasMore: newMessages.length === limit,
          isLoading: false,
          isLoadingMore: false
        }))

        // Auto-scroll to bottom for new channel or new messages
        if (!isLoadingMore) {
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
          }, 100)
        }
      } else {
        setState(prev => ({
          ...prev,
          error: response.error || 'Failed to fetch messages',
          isLoading: false,
          isLoadingMore: false
        }))
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'An unexpected error occurred',
        isLoading: false,
        isLoadingMore: false
      }))
    }
  }, [channelId, limit])

  // Send a new message
  const sendMessage = useCallback(async (messageData: SendMessageData): Promise<boolean> => {
    if (!channelId || !userId) {
      setState(prev => ({ ...prev, error: 'Channel or user not available' }))
      return false
    }

    setState(prev => ({ ...prev, isSending: true, error: null }))

    try {
      const response = await channelService.sendMessage(channelId, userId, messageData)
      
      if (response.success && response.data) {
        // Optimistic update - add message immediately
        setState(prev => ({
          ...prev,
          messages: [...prev.messages, response.data!],
          isSending: false
        }))

        // Auto-scroll to bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 100)

        return true
      } else {
        setState(prev => ({
          ...prev,
          error: response.error || 'Failed to send message',
          isSending: false
        }))
        return false
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'An unexpected error occurred',
        isSending: false
      }))
      return false
    }
  }, [channelId, userId])

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(async () => {
    if (state.isLoadingMore || !state.hasMore || !channelId) return
    
    await fetchMessages(true)
  }, [state.isLoadingMore, state.hasMore, channelId, fetchMessages])

  // Mark message as read
  const markAsRead = useCallback((messageId: string) => {
    setState(prev => ({
      ...prev,
      lastReadMessageId: messageId
    }))

    // TODO: Update lastReadMessageId in channel-members collection
    // This would typically be done via a service call
  }, [])

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // Refresh messages
  const refreshMessages = useCallback(async () => {
    await fetchMessages(false)
  }, [fetchMessages])

  // Handle channel change
  useEffect(() => {
    if (channelId !== currentChannelId.current) {
      currentChannelId.current = channelId
      
      // Reset state for new channel
      setState({
        messages: [],
        isLoading: false,
        isSending: false,
        isLoadingMore: false,
        hasMore: true,
        error: null,
        lastReadMessageId: undefined
      })

      // Fetch messages for new channel
      if (channelId) {
        fetchMessages(false)
      }
    }
  }, [channelId, fetchMessages])

  // Subscribe to real-time message updates
  useEffect(() => {
    if (!channelId) return

    const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'main'
    const CHANNEL_MESSAGES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_CHANNEL_MESSAGES_COLLECTION_ID || 'channel-messages'

    // Subscribe to new messages in this channel
    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.${CHANNEL_MESSAGES_COLLECTION_ID}.documents`,
      (response) => {
        const events = response.events || []
        const payload = response.payload as any

        // Check if this is a new message for the current channel
        if (
          events.includes('databases.*.collections.*.documents.*.create') &&
          payload?.channelId === channelId
        ) {
          // Fetch the new message with sender info
          channelService.getChannelMessages(channelId, 1).then((messageResponse) => {
            if (messageResponse.success && messageResponse.data && messageResponse.data.length > 0) {
              const newMessage = messageResponse.data[0]
              
              // Check if message is not already in the list (avoid duplicates from optimistic updates)
              setState(prev => {
                const messageExists = prev.messages.some(m => m.$id === newMessage.$id)
                if (messageExists) return prev

                return {
                  ...prev,
                  messages: [...prev.messages, newMessage]
                }
              })

              // Auto-scroll to bottom if user is near the bottom
              setTimeout(() => {
                const container = messagesEndRef.current?.parentElement
                if (container) {
                  const isNearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 100
                  if (isNearBottom) {
                    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
                  }
                }
              }, 100)
            }
          })
        }

        // Handle message updates (edits, deletes, etc.)
        if (
          events.includes('databases.*.collections.*.documents.*.update') &&
          payload?.channelId === channelId
        ) {
          // Refresh messages to get updated content
          fetchMessages(false)
        }
      }
    )

    return () => {
      unsubscribe()
    }
  }, [channelId, fetchMessages, client])

  // Auto-mark messages as read when they come into view
  useEffect(() => {
    if (state.messages.length > 0) {
      const latestMessage = state.messages[state.messages.length - 1]
      
      // Auto-mark as read after a delay (simulating user viewing the message)
      const timer = setTimeout(() => {
        if (latestMessage && latestMessage.$id !== state.lastReadMessageId) {
          markAsRead(latestMessage.$id)
        }
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [state.messages, state.lastReadMessageId, markAsRead])

  return {
    ...state,
    sendMessage,
    loadMoreMessages,
    markAsRead,
    clearError,
    refreshMessages
  }
} 