'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Moon, Sun, Command } from 'lucide-react'
import Sidebar from '../../components/Sidebar'
import ChannelList from '../../components/ChannelList'
import ChatList from '../../components/ChatList'
import EnhancedChatInterface from '../../components/EnhancedChatInterface'
import CreateChannelModal from '../../components/CreateChannelModal'
import ContactsIntegration from '../../components/ContactsIntegration'
import ErrorBoundary from '../../components/ErrorBoundary'
import { ToastProvider, useToast } from '../../components/ToastNotification'
import { useChannels } from '../../hooks/useChannels'
import { useChannelMessages } from '../../hooks/useChannelMessages'
import { useTypingIndicator,} from '../../hooks/useTyping'
import { 
  useTheme, 
  useKeyboardShortcuts, 
  useDebounce, 
  useScreenReader, 
  useFocusManagement,
  useMediaQuery 
} from '../../hooks/useUtils'
import { useAuth } from '../../context/AuthContext'
import userService from '../../services/userService'
import { CreateChannelData, SendMessageData } from '../../types/channel'
import { 
  ChannelListSkeleton, 
  ChatListSkeleton, 
} from '../../components/SkeletonLoader'
import BottomNav from '@/components/dashboard/BottomNav'

interface Contact {
  id: string
  name: string
  phoneNumbers?: string[]
  emailAddresses?: string[]
  selected?: boolean
}

const GroupsPageContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('channels')
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isContactsModalOpen, setIsContactsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [userInitialized, setUserInitialized] = useState(false)

  // Get authenticated user
  const { user, loading: authLoading } = useAuth()

  // Utility hooks
  const { theme, toggleTheme } = useTheme()
  const { addToast } = useToast()
  const { announce } = useScreenReader()
  const { saveFocus, restoreFocus } = useFocusManagement()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // Custom hooks - initialize with undefined when user not ready
  const {
    userChannels,
    publicChannels,
    isLoading: channelsLoading,
    isCreating,
    isJoining,
    createChannel,
    joinChannel,
    error: channelsError,
    clearError: clearChannelsError
  } = useChannels(userInitialized ? user?.id : undefined)

  const {
    messages,
    isLoading: messagesLoading,
    isSending,
    sendMessage,
    error: messagesError,
    clearError: clearMessagesError
  } = useChannelMessages(selectedChannelId, userInitialized ? user?.id : undefined)

  const {
    startTyping,
    stopTyping,
    typingText
  } = useTypingIndicator(selectedChannelId, userInitialized ? user?.id : undefined, user?.name)

  // Calculate total unread count for sidebar badge
  const totalUnreadCount = useMemo(() => 
    userChannels.reduce((total, uc) => total + (uc.unreadCount || 0), 0),
    [userChannels]
  )

  // Filtered messages based on search
  const filteredMessages = useMemo(() => {
    if (!debouncedSearchQuery) return messages
    return messages.filter(msg =>
      msg.content.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      msg.sender.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    )
  }, [messages, debouncedSearchQuery])

  // Refs to track if errors have been shown to prevent duplicates
  const channelsErrorShownRef = useRef<string | null>(null)
  const messagesErrorShownRef = useRef<string | null>(null)

  // Keyboard shortcuts
  useKeyboardShortcuts({
    'cmd+k': () => {
      setShowSearch(true)
      announce('Search opened', 'polite')
    },
    'escape': () => {
      if (showSearch) {
        setShowSearch(false)
        setSearchQuery('')
        announce('Search closed', 'polite')
      }
      if (isCreateModalOpen) {
        setIsCreateModalOpen(false)
        restoreFocus()
      }
      if (isContactsModalOpen) {
        setIsContactsModalOpen(false)
        restoreFocus()
      }
    },
    'cmd+shift+n': () => {
      if (user?.role === 'admin') {
        saveFocus()
        setIsCreateModalOpen(true)
        announce('Create channel modal opened', 'polite')
      }
    },
    'cmd+shift+t': () => {
      toggleTheme()
      announce(`Switched to ${theme === 'light' ? 'dark' : 'light'} theme`, 'polite')
    }
  })

  // Error handling
  useEffect(() => {
    if (channelsError && channelsError !== channelsErrorShownRef.current) {
      channelsErrorShownRef.current = channelsError
      addToast({
        type: 'error',
        title: 'Channel Error',
        message: channelsError,
        action: {
          label: 'Retry',
          onClick: () => {
            clearChannelsError()
            channelsErrorShownRef.current = null
          }
        }
      })
    } else if (!channelsError) {
      channelsErrorShownRef.current = null
    }
  }, [channelsError, addToast, clearChannelsError])

  useEffect(() => {
    if (messagesError && messagesError !== messagesErrorShownRef.current) {
      messagesErrorShownRef.current = messagesError
      addToast({
        type: 'error',
        title: 'Message Error',
        message: messagesError,
        action: {
          label: 'Retry',
          onClick: () => {
            clearMessagesError()
            messagesErrorShownRef.current = null
          }
        }
      })
    } else if (!messagesError) {
      messagesErrorShownRef.current = null
    }
  }, [messagesError, addToast, clearMessagesError])

  // Initialize user in database on component mount
  useEffect(() => {
    const initializeUser = async () => {
      if (!user || !user.id) {
        return
      }

      try {
        const userResponse = await userService.createOrGetUser({
          userId: user.id,
          name: user.name || 'Unknown User',
          email: user.email || '',
          role: user.role || 'user',
          profilePicture: user.profilePicture || '/api/placeholder/40/40'
        })

        if (userResponse.success) {
          setUserInitialized(true)
        } else {
          console.error('Failed to initialize user:', userResponse.error)
          addToast({
            type: 'error',
            title: 'Initialization Error',
            message: 'Failed to initialize user. Please refresh the page.'
          })
        }
      } catch (error) {
        console.error('Error initializing user:', error)
        addToast({
          type: 'error',
          title: 'Initialization Error',
          message: 'Failed to initialize user. Please refresh the page.'
        })
      }
    }

    if (user && !authLoading) {
      initializeUser()
    }
  }, [user, authLoading, addToast])

  // Show loading if auth is still loading
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="p-6 rounded-lg shadow-xl bg-white">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            <span className="text-gray-700">Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  // Redirect to login if no user
  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600">Please log in to access the groups.</p>
        </div>
      </div>
    )
  }

  // Handle tab changes
  const handleTabChange = (tab: string) => {
    if (tab === 'add') {
      saveFocus()
      if (user.role === 'admin') {
        setIsCreateModalOpen(true)
        announce('Create channel modal opened', 'polite')
      } else {
        setIsContactsModalOpen(true)
        announce('Contacts modal opened', 'polite')
      }
      return
    }
    setActiveTab(tab)
    announce(`Switched to ${tab} section`, 'polite')
  }

  // Handle channel selection
  const handleChannelSelect = (channelId: string) => {
    setSelectedChannelId(channelId)
    setActiveTab('channels')
    
    const userChannel = userChannels.find(uc => uc.channel.$id === channelId)?.channel
    const publicChannelInfo = publicChannels.find(c => c.$id === channelId)
    const currentChannel = userChannel || publicChannelInfo
    
    if (currentChannel) {
      announce(`Selected ${currentChannel.name} channel`, 'polite')
    }
  }

  // Handle channel creation
  const handleCreateChannel = async (channelData: CreateChannelData) => {
    const success = await createChannel(channelData)
    if (success) {
      setIsCreateModalOpen(false)
      restoreFocus()
      addToast({
        type: 'success',
        title: 'Channel Created',
        message: `${channelData.name} has been created successfully`
      })
      announce(`Channel ${channelData.name} created successfully`, 'assertive')
      
      setTimeout(() => {
        if (userChannels.length > 0) {
          setSelectedChannelId(userChannels[0].channel.$id)
        }
      }, 500)
    } else {
      addToast({
        type: 'error',
        title: 'Failed to Create Channel',
        message: 'Please try again or contact support'
      })
    }
    return success
  }

  // Handle joining channel
  const handleJoinChannel = async (channelId: string) => {
    const success = await joinChannel(channelId)
    if (success) {
      setSelectedChannelId(channelId)
      const joinedCh = publicChannels.find(c => c.$id === channelId)
      addToast({
        type: 'success',
        title: 'Joined Channel',
        message: `Welcome to ${joinedCh?.name || 'the channel'}`
      })
      announce(`Joined ${joinedCh?.name || 'channel'} successfully`, 'assertive')
    } else {
      addToast({
        type: 'error',
        title: 'Failed to Join Channel',
        message: 'Please try again'
      })
    }
  }

  // Handle message sending
  const handleSendMessage = async (messageData: SendMessageData): Promise<boolean> => {
    const success = await sendMessage(messageData)
    if (!success) {
      addToast({
        type: 'error',
        title: 'Failed to Send Message',
        message: 'Please check your connection and try again'
      })
    }
    return success
  }

  // Handle contact selection (for chat tab)
  const handleContactSelect = () => {
    addToast({
      type: 'info',
      title: 'Direct Message',
      message: 'DM feature coming soon!'
    })
  }

  // Handle add contacts
  const handleAddContacts = () => {
    saveFocus()
    setIsContactsModalOpen(true)
    announce('Contacts modal opened', 'polite')
  }

  // Handle contacts imported
  const handleContactsImported = (contacts: Contact[]) => {
    restoreFocus()
    addToast({
      type: 'success',
      title: 'Contacts Imported',
      message: `${contacts.length} contacts imported successfully`
    })
    announce(`${contacts.length} contacts imported`, 'assertive')
  }

  // Get selected channel info
  const selectedChannel = userChannels.find(uc => uc.channel?.$id === selectedChannelId)?.channel ||
                          publicChannels.find(c => c.$id === selectedChannelId)
  
  // Page transition variants
  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  }

  const slideVariants = {
    initial: { x: '100%' },
    animate: { x: 0 },
    exit: { x: '100%' }
  }

  return (
    <div className={`flex h-screen ${theme === 'dark' ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* User Initialization Loading */}
      {!userInitialized && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className={`p-6 rounded-lg shadow-xl ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              <span className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
                Initializing user...
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Screen reader announcements */}
      <div id="announcements" aria-live="polite" aria-atomic="true" className="sr-only" />
      
      {/* Sidebar with notification badge - Hide on mobile when channel is selected */}
      {!(isMobile && selectedChannel) && (
        <div className="relative">
          <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
          
          {/* Notification Badge */}
          {totalUnreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
              aria-label={`${totalUnreadCount} unread messages`}
            >
              {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
            </motion.div>
          )}

          {/* Theme Toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className={`absolute bottom-4 left-2 p-2 rounded-lg transition-colors ${
              theme === 'dark' 
                ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' 
                : 'bg-white text-gray-600 hover:bg-gray-100'
            } shadow-lg`}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </motion.button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'chat' && (
            <motion.div
              key="chat"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="flex-1"
            >
              <ErrorBoundary>
                {channelsLoading ? (
                  <ChatListSkeleton />
                ) : (
                  <ChatList
                    contacts={[]}
                    onAddContacts={handleAddContacts}
                    onContactSelect={handleContactSelect}
                  />
                )}
              </ErrorBoundary>
            </motion.div>
          )}

          {activeTab === 'channels' && (
            <motion.div
              key="channels"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="flex-1 flex"
            >
              {/* Mobile: Show either ChannelList OR EnhancedChatInterface */}
              {isMobile ? (
                <AnimatePresence mode="wait">
                  {selectedChannel ? (
                    // Mobile: Show chat interface full-width
                    <motion.div
                      key={selectedChannel.$id}
                      variants={slideVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={{ duration: 0.4, ease: 'easeInOut' }}
                      className="flex-1"
                    >
                      <ErrorBoundary>
                        <EnhancedChatInterface
                          channelName={selectedChannel?.name || 'General Chat'}
                          messages={showSearch ? filteredMessages : messages}
                          unreadCount={
                            userChannels.find(uc => uc.channel.$id === selectedChannelId)?.unreadCount || 0
                          }
                          isLoading={messagesLoading}
                          isSending={isSending}
                          onSendMessage={handleSendMessage}
                          onStartTyping={startTyping}
                          onStopTyping={stopTyping}
                          typingText={typingText}
                          canManageChannel={user.role === 'admin'}
                          channelId={selectedChannelId ?? undefined}
                          channel={selectedChannel}
                          isUserMember={userChannels.some(uc => uc.channel?.$id === selectedChannelId)}
                          onJoinChannel={async (chId: string) => {
                            const success = await joinChannel(chId)
                            if (success) {
                              const joinedCh = publicChannels.find(c => c.$id === chId) || userChannels.find(uc => uc.channel.$id === chId)?.channel
                              addToast({
                                type: 'success',
                                title: 'Joined Channel',
                                message: `Welcome to ${joinedCh?.name || 'the channel'}!`
                              })
                              announce(`Joined ${joinedCh?.name || 'channel'} successfully`, 'assertive')
                            }
                            return success
                          }}
                          // Mobile-specific props
                          showBackButton={true}
                          onBackClick={() => setSelectedChannelId(null)}
                        />
                      </ErrorBoundary>
                    </motion.div>
                  ) : (
                    // Mobile: Show channel list full-width
                    <motion.div
                      key="channel-list"
                      variants={pageVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="flex-1"
                    >
                      <ErrorBoundary>
                        {channelsLoading ? (
                          <ChannelListSkeleton />
                        ) : (
                          <ChannelList onChannelSelect={handleChannelSelect} />
                        )}
                      </ErrorBoundary>
                    </motion.div>
                  )}
                </AnimatePresence>
              ) : (
                // Desktop: Show both ChannelList and Chat side-by-side
                <>
                  {/* Channel List */}
                  <div className="w-80 border-r border-gray-200">
                    <ErrorBoundary>
                      {channelsLoading ? (
                        <ChannelListSkeleton />
                      ) : (
                        <ChannelList onChannelSelect={handleChannelSelect} />
                      )}
                    </ErrorBoundary>
                  </div>

                  {/* Chat Interface */}
                  <AnimatePresence mode="wait">
                    {selectedChannel ? (
                      <motion.div
                        key={selectedChannel.$id}
                        variants={slideVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.4, ease: 'easeInOut' }}
                        className="flex-1"
                      >
                        <ErrorBoundary>
                          <EnhancedChatInterface
                            channelName={selectedChannel?.name || 'General Chat'}
                            messages={showSearch ? filteredMessages : messages}
                            unreadCount={
                              userChannels.find(uc => uc.channel.$id === selectedChannelId)?.unreadCount || 0
                            }
                            isLoading={messagesLoading}
                            isSending={isSending}
                            onSendMessage={handleSendMessage}
                            onStartTyping={startTyping}
                            onStopTyping={stopTyping}
                            typingText={typingText}
                            canManageChannel={user.role === 'admin'}
                            channelId={selectedChannelId ?? undefined}
                            channel={selectedChannel}
                            isUserMember={userChannels.some(uc => uc.channel?.$id === selectedChannelId)}
                            onJoinChannel={async (chId: string) => {
                              const success = await joinChannel(chId)
                              if (success) {
                                const joinedCh = publicChannels.find(c => c.$id === chId) || userChannels.find(uc => uc.channel.$id === chId)?.channel
                                addToast({
                                  type: 'success',
                                  title: 'Joined Channel',
                                  message: `Welcome to ${joinedCh?.name || 'the channel'}!`
                                })
                                announce(`Joined ${joinedCh?.name || 'channel'} successfully`, 'assertive')
                              }
                              return success
                            }}
                          />
                        </ErrorBoundary>
                      </motion.div>
                    ) : (
                      <motion.div
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className={`flex-1 flex items-center justify-center ${
                          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                        }`}
                      >
                        <div className="text-center">
                          <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                          }`}>
                            <MessageSquare className={`w-8 h-8 ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-400'
                            }`} />
                          </div>
                          <h3 className={`text-lg font-medium mb-2 ${
                            theme === 'dark' ? 'text-gray-200' : 'text-gray-900'
                          }`}>
                            Select a Channel
                          </h3>
                          <p className={`text-sm mb-4 ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            Choose a channel to start chatting
                          </p>
                          
                          <div className={`flex items-center justify-center space-x-2 text-xs ${
                            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                          }`}>
                            <Command size={12} />
                            <span>Press Cmd+K to search</span>
                          </div>
                          
                          {publicChannels.length > 0 && !channelsLoading && (
                            <div className="mt-6 max-w-sm">
                              <p className={`text-sm mb-3 ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                Available channels:
                              </p>
                              <div className="space-y-2">
                                {publicChannels.slice(0, 3).map((ch) => (
                                  <button
                                    key={ch.$id}
                                    onClick={() => handleJoinChannel(ch.$id)}
                                    disabled={isJoining === ch.$id}
                                    className={`w-full p-3 text-left border rounded-lg transition-colors disabled:opacity-50 ${
                                      theme === 'dark'
                                        ? 'border-gray-600 hover:bg-gray-700 text-gray-200'
                                        : 'border-gray-200 hover:bg-gray-50 text-gray-900'
                                    }`}
                                    aria-label={`Join ${ch.name} channel`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <div className="font-medium">#{ch.name}</div>
                                        <div className={`text-sm ${
                                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                        }`}>
                                          {ch.description}
                                        </div>
                                      </div>
                                      {isJoining === ch.$id && (
                                        <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                                      )}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Create Channel Modal */}
      <CreateChannelModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false)
          restoreFocus()
        }}
        onSubmit={handleCreateChannel}
      />

      {/* Contacts Integration Modal */}
      <ContactsIntegration
        isOpen={isContactsModalOpen}
        onClose={() => {
          setIsContactsModalOpen(false)
          restoreFocus()
        }}
        onContactsImported={handleContactsImported}
      />

      {/* Search Overlay */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 flex items-start justify-center pt-20"
            onClick={() => setShowSearch(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-md mx-4 p-4 rounded-lg shadow-xl ${
                theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
              }`}
            >
              <input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-gray-200'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                aria-label="Search messages"
              />
              <div className={`mt-2 text-xs ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Press Escape to close
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      <AnimatePresence>
        {(isCreating || (isJoining && !selectedChannelId)) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 flex items-center justify-center"
          >
            <div className={`p-6 rounded-lg shadow-xl ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                <span className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
                  {isCreating ? 'Creating channel...' : 'Joining channel...'}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Online Status Indicator */}
      {/* <div className="fixed top-16 left-24">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm ${
            isOnline 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}
        >
          <div className={`w-2 h-2 rounded-full ${
            isOnline ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <span>{isOnline ? 'Online' : 'Offline'}</span>
          {onlineUsers.length > 0 && (
            <span className="ml-1 text-xs">({onlineUsers.length} online)</span>
          )}
        </motion.div>
      </div> */}

      {/* Typing Indicator */}
      <AnimatePresence>
        {typingText && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-20 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full shadow-lg border text-sm z-30 ${
              theme === 'dark'
                ? 'bg-gray-800 border-gray-600 text-gray-300'
                : 'bg-white border-gray-200 text-gray-600'
            }`}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span>{typingText}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!selectedChannel ? (<BottomNav />) : (<div className="hidden"></div>)}
    </div>
  )
}

const GroupsPage: React.FC = () => {
  return (
    <ToastProvider>
      <ErrorBoundary>
        <GroupsPageContent />
      </ErrorBoundary>
    </ToastProvider>
  )
}

export default GroupsPage