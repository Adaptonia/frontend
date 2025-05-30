import { useState, useEffect, useCallback, useRef } from 'react'
import { Client } from 'appwrite'

interface TypingUser {
  userId: string
  username: string
  timestamp: number
}

interface UseTypingIndicatorState {
  typingUsers: TypingUser[]
  isTyping: boolean
  typingText: string
}

interface UseTypingIndicatorActions {
  startTyping: () => void
  stopTyping: () => void
  setTypingStatus: (isTyping: boolean) => void
}

export interface UseTypingIndicatorReturn extends UseTypingIndicatorState, UseTypingIndicatorActions {}

const TYPING_TIMEOUT = 3000 // 3 seconds
const TYPING_CLEANUP_INTERVAL = 1000 // 1 second

export const useTypingIndicator = (
  channelId: string | null,
  userId?: string,
  username?: string
): UseTypingIndicatorReturn => {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const [isTyping, setIsTyping] = useState(false)
  
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize Appwrite client for realtime subscriptions
  const client = new Client()
  client
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')

  // Generate typing text from typing users
  const typingText = (() => {
    const otherTypingUsers = typingUsers.filter(user => user.userId !== userId)
    
    if (otherTypingUsers.length === 0) return ''
    
    if (otherTypingUsers.length === 1) {
      return `${otherTypingUsers[0].username} is typing...`
    }
    
    if (otherTypingUsers.length === 2) {
      return `${otherTypingUsers[0].username} and ${otherTypingUsers[1].username} are typing...`
    }
    
    return `${otherTypingUsers[0].username} and ${otherTypingUsers.length - 1} others are typing...`
  })()

  // Send typing status to other users
  const sendTypingStatus = useCallback((typing: boolean) => {
    if (!channelId || !userId || !username) return

    // Use Appwrite's realtime to broadcast typing status
    // We'll use a custom channel for typing indicators
    const typingChannel = `typing.${channelId}`
    
    try {
      // Broadcast typing status
      client.subscribe(typingChannel, () => {})
      
      // Send typing event (in a real implementation, you might use a custom event system)
      // For now, we'll simulate this with localStorage for demo purposes
      const typingEvent = {
        channelId,
        userId,
        username,
        isTyping: typing,
        timestamp: Date.now()
      }
      
      // Store in localStorage for cross-tab communication
      localStorage.setItem(`typing_${channelId}_${userId}`, JSON.stringify(typingEvent))
      
      // Trigger custom event for other instances
      window.dispatchEvent(new CustomEvent('typingStatusChanged', {
        detail: typingEvent
      }))
      
    } catch (error) {
      console.error('Error sending typing status:', error)
    }
  }, [channelId, userId, username, client])

  // Start typing
  const startTyping = useCallback(() => {
    if (isTyping) return

    setIsTyping(true)
    sendTypingStatus(true)

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping()
    }, TYPING_TIMEOUT)
  }, [isTyping, sendTypingStatus])

  // Stop typing
  const stopTyping = useCallback(() => {
    if (!isTyping) return

    setIsTyping(false)
    sendTypingStatus(false)

    // Clear timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }
  }, [isTyping, sendTypingStatus])

  // Set typing status (for external control)
  const setTypingStatus = useCallback((typing: boolean) => {
    if (typing) {
      startTyping()
    } else {
      stopTyping()
    }
  }, [startTyping, stopTyping])

  // Clean up old typing users
  const cleanupTypingUsers = useCallback(() => {
    const now = Date.now()
    setTypingUsers(prev => 
      prev.filter(user => now - user.timestamp < TYPING_TIMEOUT + 1000)
    )
  }, [])

  // Handle typing events from other users
  useEffect(() => {
    if (!channelId) return

    const handleTypingEvent = (event: CustomEvent) => {
      const { channelId: eventChannelId, userId: eventUserId, username: eventUsername, isTyping: eventIsTyping, timestamp } = event.detail

      // Only handle events for the current channel
      if (eventChannelId !== channelId) return

      // Don't handle our own events
      if (eventUserId === userId) return

      if (eventIsTyping) {
        // Add or update typing user
        setTypingUsers(prev => {
          const existingIndex = prev.findIndex(user => user.userId === eventUserId)
          const typingUser: TypingUser = {
            userId: eventUserId,
            username: eventUsername,
            timestamp
          }

          if (existingIndex >= 0) {
            // Update existing user
            const updated = [...prev]
            updated[existingIndex] = typingUser
            return updated
          } else {
            // Add new typing user
            return [...prev, typingUser]
          }
        })
      } else {
        // Remove typing user
        setTypingUsers(prev => prev.filter(user => user.userId !== eventUserId))
      }
    }

    // Listen for typing events
    window.addEventListener('typingStatusChanged', handleTypingEvent as EventListener)

    return () => {
      window.removeEventListener('typingStatusChanged', handleTypingEvent as EventListener)
    }
  }, [channelId, userId])

  // Subscribe to typing events via localStorage for cross-tab communication
  useEffect(() => {
    if (!channelId) return

    const handleStorageChange = (event: StorageEvent) => {
      if (!event.key?.startsWith(`typing_${channelId}_`) || !event.newValue) return

      try {
        const typingEvent = JSON.parse(event.newValue)
        
        // Don't handle our own events
        if (typingEvent.userId === userId) return

        // Dispatch custom event to handle it
        window.dispatchEvent(new CustomEvent('typingStatusChanged', {
          detail: typingEvent
        }))
      } catch (error) {
        console.error('Error parsing typing event:', error)
      }
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [channelId, userId])

  // Set up cleanup interval
  useEffect(() => {
    cleanupIntervalRef.current = setInterval(cleanupTypingUsers, TYPING_CLEANUP_INTERVAL)

    return () => {
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current)
      }
    }
  }, [cleanupTypingUsers])

  // Reset state when channel changes
  useEffect(() => {
    setTypingUsers([])
    setIsTyping(false)
    
    // Clear timeouts
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }
  }, [channelId])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop typing on unmount
      if (isTyping) {
        sendTypingStatus(false)
      }
      
      // Clear timeouts
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current)
      }
    }
  }, [isTyping, sendTypingStatus])

  return {
    typingUsers,
    isTyping,
    typingText,
    startTyping,
    stopTyping,
    setTypingStatus
  }
}

// Hook for online status tracking
interface UseOnlineStatusState {
  isOnline: boolean
  lastSeen?: Date
  onlineUsers: string[] // Array of user IDs who are online
}

interface UseOnlineStatusActions {
  setOnlineStatus: (online: boolean) => void
  updateLastSeen: () => void
}

export interface UseOnlineStatusReturn extends UseOnlineStatusState, UseOnlineStatusActions {}

export const useOnlineStatus = (userId?: string): UseOnlineStatusReturn => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [lastSeen, setLastSeen] = useState<Date>()
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])

  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize Appwrite client
  const client = new Client()
  client
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')

  // Set online status
  const setOnlineStatus = useCallback((online: boolean) => {
    setIsOnline(online)
    
    if (userId) {
      // Broadcast online status
      const statusEvent = {
        userId,
        isOnline: online,
        timestamp: Date.now()
      }
      
      localStorage.setItem(`online_${userId}`, JSON.stringify(statusEvent))
      window.dispatchEvent(new CustomEvent('onlineStatusChanged', {
        detail: statusEvent
      }))
    }
  }, [userId])

  // Update last seen timestamp
  const updateLastSeen = useCallback(() => {
    const now = new Date()
    setLastSeen(now)
    
    if (userId) {
      localStorage.setItem(`lastSeen_${userId}`, now.toISOString())
    }
  }, [userId])

  // Send heartbeat to maintain online status
  const sendHeartbeat = useCallback(() => {
    if (isOnline && userId) {
      updateLastSeen()
      setOnlineStatus(true)
    }
  }, [isOnline, userId, updateLastSeen, setOnlineStatus])

  // Handle browser online/offline events
  useEffect(() => {
    const handleOnline = () => setOnlineStatus(true)
    const handleOffline = () => setOnlineStatus(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setOnlineStatus])

  // Handle visibility change (tab focus/blur)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setOnlineStatus(true)
      } else {
        updateLastSeen()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [setOnlineStatus, updateLastSeen])

  // Set up heartbeat interval
  useEffect(() => {
    if (isOnline && userId) {
      heartbeatIntervalRef.current = setInterval(sendHeartbeat, 30000) // 30 seconds
    } else if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
      heartbeatIntervalRef.current = null
    }

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
      }
    }
  }, [isOnline, userId, sendHeartbeat])

  // Handle online status events from other users
  useEffect(() => {
    const handleOnlineStatusEvent = (event: CustomEvent) => {
      const { userId: eventUserId, isOnline: eventIsOnline } = event.detail

      if (eventIsOnline) {
        setOnlineUsers(prev => [...new Set([...prev, eventUserId])])
      } else {
        setOnlineUsers(prev => prev.filter(id => id !== eventUserId))
      }
    }

    window.addEventListener('onlineStatusChanged', handleOnlineStatusEvent as EventListener)

    return () => {
      window.removeEventListener('onlineStatusChanged', handleOnlineStatusEvent as EventListener)
    }
  }, [])

  // Initialize online status
  useEffect(() => {
    if (userId) {
      setOnlineStatus(navigator.onLine)
      updateLastSeen()
    }
  }, [userId, setOnlineStatus, updateLastSeen])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (userId) {
        setOnlineStatus(false)
      }
      
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
      }
    }
  }, [userId, setOnlineStatus])

  return {
    isOnline,
    lastSeen,
    onlineUsers,
    setOnlineStatus,
    updateLastSeen
  }
} 