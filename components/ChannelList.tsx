'use client'

import React, { useState, useMemo } from 'react'
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
  Loader2 
} from 'lucide-react'
import { useChannelsWithCache } from '../hooks/useChannelsWithCache'
import { useRequireAuth } from '../hooks/useRequireAuth'

interface ChannelListProps {
  onChannelSelect: (channelId: string) => void
}

const ChannelList: React.FC<ChannelListProps> = ({ onChannelSelect }) => {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  
  // Get current user ID from auth context
  const { user } = useRequireAuth()
  
  const {
    userChannels,
    publicChannels,
    isLoading: channelsLoading,
    isCacheHit,
    isRefreshing
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

  return (
    <div className="flex-1 bg-white flex flex-col h-full rounded-tl-3xl mt-16">
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
            <span>Adaptonia Finance</span>
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
        <p className="text-sm text-gray-500">102 members • Channel</p>
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
      <div 
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400"
        style={{ maxHeight: 'calc(100vh - 280px)' }}
      >
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
                        <motion.button
                          key={channel.$id}
                          onClick={() => handleChannelClick(channel.$id)}
                          disabled={!channelsClickable}
                          className={`w-full px-6 py-2 flex items-center justify-between group transition-colors ${
                            channelsClickable 
                              ? 'hover:bg-gray-50 cursor-pointer' 
                              : 'cursor-not-allowed opacity-70'
                          }`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3 }}
                          whileHover={channelsClickable ? { x: 4 } : {}}
                        >
                          <div className="flex items-center space-x-3 flex-1">
                            <Hash size={16} className="text-gray-400" />
                            <div className="flex-1 text-left">
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
                          </div>
                        </motion.button>
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
    </div>
  )
}

export default ChannelList 