'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Hash, 
  Search, 
  Plus, 
  Smile, 
  Send, 
  Mic, 
  ArrowLeft, 
  Users, 
  MoreVertical,
  Reply,
  Heart,
  ThumbsUp,
  Laugh,
  Angry,
  File,
  Paperclip
} from 'lucide-react'
import { MessageWithSender, SendMessageData, Channel } from '../types/channel'
import { ChatInterfaceSkeleton } from './SkeletonLoader'
import ChannelJoinBanner from './ChannelJoinBanner'
import { useToast } from './ToastNotification'

interface EnhancedChatInterfaceProps {
  channelName: string
  messages: MessageWithSender[]
  unreadCount?: number
  isLoading?: boolean
  isSending?: boolean
  onSendMessage?: (data: SendMessageData) => Promise<boolean>
  onStartTyping?: () => void
  onStopTyping?: () => void
  typingText?: string
  canManageChannel?: boolean
  channelId?: string
  channel?: Channel
  isUserMember?: boolean
  onJoinChannel?: (channelId: string) => Promise<boolean>
  showBackButton?: boolean
  onBackClick?: () => void
}

interface MessageReaction {
  emoji: string
  users: string[]
  count: number
}

interface ReplyingTo {
  messageId: string
  username: string
  content: string
}

const REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '😡']

const EnhancedChatInterface: React.FC<EnhancedChatInterfaceProps> = ({
  channelName,
  messages,
  unreadCount = 0,
  isLoading = false,
  isSending = false,
  onSendMessage,
  onStartTyping,
  onStopTyping,
  typingText,
  canManageChannel = false,
  channelId,
  channel,
  isUserMember = true,
  onJoinChannel,
  showBackButton = false,
  onBackClick
}) => {
  const [message, setMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [replyingTo, setReplyingTo] = useState<ReplyingTo | null>(null)
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null)
  const [messageReactions, setMessageReactions] = useState<Record<string, MessageReaction[]>>({})
  const [showMemberPanel, setShowMemberPanel] = useState(false)
  const [showJoinBanner, setShowJoinBanner] = useState(!isUserMember)

  const { addToast } = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Update join banner visibility when membership status changes
  useEffect(() => {
    setShowJoinBanner(!isUserMember)
  }, [isUserMember])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle channel join
  const handleJoinChannel = async (): Promise<boolean> => {
    if (!channelId || !onJoinChannel) return false

    try {
      const success = await onJoinChannel(channelId)
      if (success) {
        setShowJoinBanner(false)
        addToast({
          type: 'success',
          title: 'Welcome!',
          message: `You've joined #${channelName}! Start chatting below.`
        })
      }
      return success
    } catch (error: unknown) {
      console.error('error', error)
      addToast({
        type: 'error',
        title: 'Join Failed',
        message: 'Unable to join the channel. Please try again.'
      })
      return false
    }
  }

  // Handle typing indicators
  const handleInputChange = (value: string) => {
    // Don't allow typing if user is not a member
    if (!isUserMember) return
    
    setMessage(value)

    if (onStartTyping && value.trim()) {
      onStartTyping()
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      // Set timeout to stop typing
      typingTimeoutRef.current = setTimeout(() => {
        onStopTyping?.()
      }, 3000)
    } else if (onStopTyping && !value.trim()) {
      onStopTyping()
    }
  }

  // Handle message send
  const handleSendMessage = async () => {
    if (!message.trim() || !onSendMessage || !isUserMember) return

    const messageData: SendMessageData = {
      content: message.trim(),
      messageType: 'text',
      replyToId: replyingTo?.messageId
    }

    const success = await onSendMessage(messageData)
    if (success) {
      setMessage('')
      setReplyingTo(null)
      onStopTyping?.()
    }
  }

  // Handle file upload
  const handleFileUpload = (files: File[]) => {
    console.log('Files uploaded:', files)
    // TODO: Implement file upload logic
  }

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    
    const files = Array.from(e.dataTransfer.files)
    handleFileUpload(files)
  }

  // Handle message reactions
  const handleReaction = (messageId: string, emoji: string) => {
    setMessageReactions(prev => {
      const reactions = prev[messageId] || []
      const existingReaction = reactions.find(r => r.emoji === emoji)
      
      if (existingReaction) {
        // Toggle reaction
        const updatedReactions = reactions.map(r => 
          r.emoji === emoji 
            ? { ...r, count: r.count + 1, users: [...r.users, 'current-user'] }
            : r
        )
        return { ...prev, [messageId]: updatedReactions }
      } else {
        // Add new reaction
        const newReaction: MessageReaction = {
          emoji,
          users: ['current-user'],
          count: 1
        }
        return { ...prev, [messageId]: [...reactions, newReaction] }
      }
    })
    setShowEmojiPicker(null)
  }

  // Format message with basic markdown
  const formatMessage = (content: string) => {
    // Bold **text**
    content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    
    // Italic *text*
    content = content.replace(/\*(.*?)\*/g, '<em>$1</em>')
    
    // Code `text`
    content = content.replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>')
    
    // Links
    content = content.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" class="text-blue-500 hover:underline">$1</a>'
    )

    return content
  }

  // Filter messages based on search
  const filteredMessages = messages.filter(msg =>
    !searchQuery || 
    msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    msg.sender.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return <ChatInterfaceSkeleton />
  }

  return (
    <div 
      className="flex-1 flex flex-col bg-white h-screen"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          {showBackButton && (
            <button
              onClick={onBackClick}
              className="mr-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Back to channels"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
          )}
          <Hash size={20} className="text-gray-600" />
          <h1 className="text-lg font-semibold">{channelName}</h1>
          <span className="text-gray-400">💬</span>
        </div>
        
        <div className="flex items-center space-x-3">
          <Search 
            size={20} 
            className="text-gray-500 cursor-pointer hover:text-gray-700"
            onClick={() => setShowSearch(!showSearch)}
          />
          <Users 
            size={20} 
            className="text-gray-500 cursor-pointer hover:text-gray-700"
            onClick={() => setShowMemberPanel(!showMemberPanel)}
          />
          {canManageChannel && (
            <MoreVertical 
              size={20} 
              className="text-gray-500 cursor-pointer hover:text-gray-700"
            />
          )}
        </div>
      </div>

      {/* Search Bar */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b px-4 py-3"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Join Banner for Non-Members */}
      <AnimatePresence>
        {showJoinBanner && channel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b"
          >
            <div className="p-4">
              <ChannelJoinBanner
                channel={channel}
                onJoinChannel={handleJoinChannel}
                onClose={() => setShowJoinBanner(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
        {/* Show limited preview for non-members */}
        {!isUserMember && (
          <div className="text-center py-8">
            <div className="max-w-md mx-auto bg-gray-50 rounded-lg p-6 border border-gray-200">
              <Hash className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Join to see messages</h3>
              <p className="text-gray-600 text-sm">
                This channel has message history, but you need to join to view and participate in conversations.
              </p>
            </div>
          </div>
        )}

        {/* Messages (only show if user is a member) */}
        {isUserMember && (
          <>
            {/* Drag overlay */}
            <AnimatePresence>
              {dragActive && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg flex items-center justify-center z-10"
                >
                  <div className="text-center">
                    <File className="mx-auto mb-2 text-blue-500" size={32} />
                    <p className="text-blue-700 font-medium">Drop files here to upload</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Unread Messages Divider */}
            {unreadCount > 0 && (
              <div className="relative flex items-center justify-center my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-red-500"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-4 text-sm text-red-500 font-medium">
                    New messages ({unreadCount})
                  </span>
                </div>
              </div>
            )}

            {/* Messages */}
            {filteredMessages.map((msg) => (
              <motion.div
                key={msg.$id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex space-x-3 group"
                onMouseEnter={() => setHoveredMessage(msg.$id)}
                onMouseLeave={() => setHoveredMessage(null)}
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                {msg.sender.profilePicture ? (
  <img
    src={msg.sender.profilePicture}
    alt={msg.sender.name}
    className="w-10 h-10 rounded-full object-cover"
  />
) : (
  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
    {msg.sender.email?.charAt(0).toUpperCase() || '?'}
  </div>
)}
                </div>

                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  {/* Username and Timestamp */}
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-semibold text-gray-900">
                      {msg.sender.email}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(msg.$createdAt).toLocaleString()}
                    </span>
                  </div>

                  {/* Reply Quote */}
                  {msg.replyToId && (
                    <div className="flex mb-2">
                      <div className="w-1 bg-blue-500 rounded-full mr-3"></div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Replying to:</span>{' '}
                        {msg.replyToId}
                      </div>
                    </div>
                  )}

                  {/* Message Content */}
                  <div 
                    className="text-sm text-gray-800 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                  />

                  {/* Reactions */}
                  {messageReactions[msg.$id] && messageReactions[msg.$id].length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {messageReactions[msg.$id].map((reaction, index) => (
                        <button
                          key={index}
                          className="flex items-center space-x-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs"
                        >
                          <span>{reaction.emoji}</span>
                          <span>{reaction.count}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Message Actions */}
                <AnimatePresence>
                  {hoveredMessage === msg.$id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-start space-x-1"
                    >
                      <button
                        onClick={() => setReplyingTo({
                          messageId: msg.$id,
                          username: msg.sender.name,
                          content: msg.content
                        })}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Reply size={16} className="text-gray-400" />
                      </button>
                      <button
                        onClick={() => setShowEmojiPicker(
                          showEmojiPicker === msg.$id ? null : msg.$id
                        )}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Smile size={16} className="text-gray-400" />
                      </button>
                      
                      {/* Emoji Picker */}
                      <AnimatePresence>
                        {showEmojiPicker === msg.$id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="absolute z-10 bg-white border rounded-lg shadow-lg p-2 flex space-x-1"
                            style={{ top: '100%', right: 0 }}
                          >
                            {REACTIONS.map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => handleReaction(msg.$id, emoji)}
                                className="p-1 hover:bg-gray-100 rounded text-lg"
                              >
                                {emoji}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Reply Preview */}
      <AnimatePresence>
        {replyingTo && isUserMember && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-2 bg-gray-50 border-t"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Reply size={16} className="text-gray-400" />
                <span className="text-sm text-gray-600">
                  Replying to <strong>{replyingTo.username}</strong>: {replyingTo.content.slice(0, 50)}...
                </span>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Heart size={16} className="text-gray-400" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Typing Indicator */}
      <AnimatePresence>
        {typingText && isUserMember && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-2"
          >
            <div className="flex items-center justify-center">
              <span className="text-sm text-blue-500">{typingText}</span>
              <ArrowLeft size={16} className="ml-2 text-gray-400" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message Input */}
      <div className="p-4 border-t">
        {isUserMember ? (
          <div className="flex items-center space-x-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-gray-500 hover:text-gray-700"
            >
              <File size={20} />
            </button>
            
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder={`Message #${channelName.toLowerCase()}`}
                value={message}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSending}
              />
            </div>
            
            <button className="text-gray-500 hover:text-gray-700">
              <Smile size={20} />
            </button>
            
            <button
              onClick={handleSendMessage}
              disabled={!message.trim() || isSending}
              className="text-blue-500 hover:text-blue-700 disabled:text-gray-400"
            >
              <Send size={20} />
            </button>
            
            <button className="text-gray-500 hover:text-gray-700">
              <Mic size={20} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center py-4">
            <div className="text-center">
              <p className="text-gray-500 text-sm mb-2">
                Join #{channelName} to start messaging
              </p>
              <button
                onClick={handleJoinChannel}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Join Channel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) {
            handleFileUpload(Array.from(e.target.files))
          }
        }}
      />
    </div>
  )
}

export default EnhancedChatInterface 