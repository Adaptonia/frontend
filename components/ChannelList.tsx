'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageSquare, 
  ChevronRight, 
  Search, 
  Hash, 
  Users, 
  Folder, 
  Palette, 
  Calendar, 
  Mic,
  Loader2,
  Trash2,
  X
} from 'lucide-react'
import { useChannelsWithCache } from '../hooks/useChannelsWithCache'
import { useRequireAuth } from '../hooks/useRequireAuth'
import { toast } from 'sonner'

interface ChannelListProps {
  onChannelSelect: (channelId: string) => void
}

// Confirmation Modal Component
interface ConfirmDeleteModalProps {
  isOpen: boolean
  channelName: string
  onConfirm: () => void
  onCancel: () => void
  isDeleting: boolean
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  channelName,
  onConfirm,
  onCancel,
  isDeleting
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Delete Channel</h3>
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-3">
            Are you sure you want to delete <span className="font-semibold">#{channelName}</span>?
          </p>
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-800">
              <strong>Warning:</strong> This action cannot be undone. All messages and members will be permanently removed.
            </p>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
          >
            {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{isDeleting ? 'Deleting...' : 'Delete Channel'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  )
}

const ChannelList: React.FC<ChannelListProps> = ({ onChannelSelect }) => {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [channelToDelete, setChannelToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Get current user ID from auth context
  const { user } = useRequireAuth()
  
  const {
    userChannels,
    publicChannels,
    isLoading: channelsLoading,
    isCacheHit,
    isRefreshing,
    deleteChannel,
    isDeleting: isDeletingFromHook
  } = useChannelsWithCache(user?.id)



  const toggleSection = (sectionId: string) => {
    const newCollapsed = new Set(collapsedSections)
    if (newCollapsed.has(sectionId)) {
      newCollapsed.delete(sectionId)
    } else {
      newCollapsed.add(sectionId)
    }
    setCollapsedSections(newCollapsed)
  }

  // Get user's joined channel IDs for reference (but don't filter public channels)
  const userChannelIds = useMemo(() => 
    new Set(userChannels.map(uc => uc.channel.$id)), 
    [userChannels]
  )

  // Filter public channels based on search query (show ALL public channels)
  const filteredPublicChannels = useMemo(() => {
    if (!searchQuery.trim()) return publicChannels
    
    return publicChannels.filter(channel =>
      channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      channel.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [publicChannels, searchQuery])

  // Determine if channels are clickable (not loading fresh data)
  const channelsClickable = !channelsLoading || isCacheHit

  const handleChannelClick = (channelId: string) => {
    if (channelsClickable) {
      onChannelSelect(channelId)
    }
  }

     const handleDeleteChannel = async (channelId: string) => {
     setChannelToDelete(channelId)
     setIsDeleteModalOpen(true)
   }

   const getChannelToDeleteName = () => {
     if (!channelToDelete) return ''
     const channel = filteredPublicChannels.find(ch => ch.$id === channelToDelete)
     return channel?.name || ''
   }

     const confirmDelete = async () => {
     if (!channelToDelete) return
 
     setIsDeleting(true)
     try {
       const success = await deleteChannel(channelToDelete)
       if (success) {
         const deletedChannel = filteredPublicChannels.find(ch => ch.$id === channelToDelete)
         toast.success(`Channel #${deletedChannel?.name || 'Unknown'} deleted successfully!`)
         setIsDeleteModalOpen(false)
         setChannelToDelete(null)
       } else {
         toast.error('Failed to delete channel. Please try again.')
       }
     } catch (error) {
       toast.error('An error occurred while deleting the channel.')
     } finally {
       setIsDeleting(false)
     }
   }

  const cancelDelete = () => {
    setIsDeleteModalOpen(false)
    setChannelToDelete(null)
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-tl-3xl mt-16 overflow-hidden">
      {/* Header Section - Fixed */}
      <div className="bg-black text-white p-8 flex-shrink-0 rounded-tl-3xl">
        <div className="flex items-center space-x-2 mb-1">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-medium text-2xl flex justify-center text-center">Finance</span>
        </div>
      </div>

      {/* Channel Info - Fixed */}
      <div className="p-4 border-b flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-semibold flex items-center space-x-2 text-gray-700">
            <span>Adaptonia Channels</span>
            <ChevronRight size={16} className="text-gray-400" />
          </h1>
          {/* Loading/Cache Status Indicator */}
          {channelsLoading && !isCacheHit && (
            <div className="flex items-center space-x-2 text-blue-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs">Loading</span>
            </div>
          )}
          {isCacheHit && (
            <div className="flex items-center space-x-2 text-green-500">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs">Cached</span>
            </div>
          )}
          {isRefreshing && (
            <div className="flex items-center space-x-2 text-blue-500">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="text-xs">Updating</span>
            </div>
          )}
        </div>
        {/* <p className="text-sm text-gray-500">102 members • Channel</p> */}
      </div>

      {/* Search Bar - Fixed */}
      <div className="p-4 border-b flex-shrink-0">
        <div className="relative flex items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!channelsClickable}
            />
          </div>
          <div className="flex items-center space-x-3 ml-4">
            <Palette size={20} className="text-gray-500 cursor-pointer hover:text-gray-700" />
            <Calendar size={20} className="text-gray-500 cursor-pointer hover:text-gray-700" />
          </div>
        </div>
      </div>

      {/* Scrollable Channel Content */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
        {/* Public Groups Section - Show ALL public channels */}
        <motion.div 
          className="border-b border-gray-100"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.1 }}
        >
          {/* Public Groups Header */}
          <button
            onClick={() => toggleSection('public-groups')}
            className="w-full p-4 flex items-center space-x-3 hover:bg-gray-50 text-left transition-colors"
            disabled={!channelsClickable}
          >
            <motion.div
              animate={{ rotate: collapsedSections.has('public-groups') ? 0 : 90 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight size={16} className="text-gray-400" />
            </motion.div>
            <Folder size={16} className="text-green-600" />
            <span className="text-sm font-medium text-gray-600">-- Public Groups --</span>
            <Folder size={16} className="text-green-600" />
          </button>

          {/* Public Channels List */}
          <AnimatePresence>
            {!collapsedSections.has('public-groups') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="pb-2">
                  {filteredPublicChannels.length > 0 ? (
                    filteredPublicChannels.map((channel) => {
                      const isUserMember = userChannelIds.has(channel.$id)
                      
                      return (
                        <motion.div
                          key={channel.$id}
                          className="w-full px-6 py-2 flex items-center justify-between group transition-colors hover:bg-gray-50"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <button
                            onClick={() => handleChannelClick(channel.$id)}
                            disabled={!channelsClickable}
                            className={`flex items-center space-x-3 flex-1 text-left ${
                              channelsClickable 
                                ? 'cursor-pointer' 
                                : 'cursor-not-allowed opacity-70'
                            }`}
                          >
                            <Hash size={16} className="text-gray-400" />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700 group-hover:text-gray-900 font-medium">
                                  {channel.name}
                                </span>
                                <div className="flex items-center space-x-1 text-xs text-gray-500">
                                  <Users size={12} />
                                  <span>{channel.memberCount}</span>
                                </div>
                                {isUserMember && (
                                  <div className="w-2 h-2 bg-green-500 rounded-full" title="Joined" />
                                )}
                              </div>
                              {channel.description && (
                                <p className="text-xs text-gray-500 truncate mt-1 max-w-[200px]">
                                  {channel.description}
                                </p>
                              )}
                            </div>
                          </button>
                          
                          {/* Admin Delete Button */}
                          {user?.role === 'admin' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteChannel(channel.$id)
                              }}
                              disabled={isDeletingFromHook === channel.$id}
                              className=" group-hover:opacity-100 p-1 rounded hover:bg-red-100 text-red-500 hover:text-red-700 transition-all duration-200 disabled:opacity-50"
                              title="Delete Channel"
                            >
                              {isDeletingFromHook === channel.$id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Trash2 size={14} />
                              )}
                            </button>
                          )}
                        </motion.div>
                      )
                    })
                  ) : channelsLoading && !isCacheHit ? (
                    // Loading state when no cache
                    <div className="px-6 py-8 text-center">
                      <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                      </div>
                      <p className="text-sm text-gray-500 mb-2">
                        Loading channels...
                      </p>
                    </div>
                  ) : (
                    // Empty state
                    <div className="px-6 py-8 text-center">
                      <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                        <Users className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500 mb-2">
                        {searchQuery ? 'No channels found' : 'No public channels available'}
                      </p>
                      {searchQuery && (
                        <p className="text-xs text-gray-400">
                          Try a different search term
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Bottom User Section - Fixed */}
      <div className="p-4 border-t bg-gray-50 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-sm font-semibold">
            {user && user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="flex-1">
            <span className="text-sm text-gray-700">{user && user.name || 'User'}</span>
            {user && user.role === 'admin' && (
              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Admin</span>
            )}
          </div>
          <Mic size={16} className="text-gray-400" />
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      `}</style>

             <ConfirmDeleteModal
         isOpen={isDeleteModalOpen}
         channelName={getChannelToDeleteName()}
         onConfirm={confirmDelete}
         onCancel={cancelDelete}
         isDeleting={isDeleting}
       />
    </div>
  )
}

export default ChannelList 
