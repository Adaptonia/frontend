'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Hash, Clock, X, Loader2 } from 'lucide-react'
import { Channel } from '../types/channel'

interface ChannelJoinBannerProps {
  channel: Channel
  onJoinChannel: () => Promise<boolean>
  onClose?: () => void
  className?: string
}

const ChannelJoinBanner: React.FC<ChannelJoinBannerProps> = ({
  channel,
  onJoinChannel,
  onClose,
  className = ''
}) => {
  const [isJoining, setIsJoining] = useState(false)

  const handleJoin = async () => {
    setIsJoining(true)
    try {
      await onJoinChannel()
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 shadow-sm ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Channel Header */}
          <div className="flex items-center space-x-3 mb-3">
            <div className="flex items-center space-x-2">
              <Hash size={20} className="text-blue-600" />
              <h3 className="font-semibold text-gray-900">{channel.name}</h3>
            </div>
            <div className="flex items-center space-x-1 text-sm text-gray-500">
              <Users size={16} />
              <span>{channel.memberCount} members</span>
            </div>
          </div>

          {/* Channel Description */}
          {channel.description && (
            <p className="text-gray-700 mb-4 text-sm leading-relaxed">
              {channel.description}
            </p>
          )}

          {/* Join Notice */}
          <div className="bg-white rounded-lg p-3 border border-blue-100 mb-4">
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
              <span className="text-gray-600">
                <strong>You&lsquo;re not a member of this channel.</strong> Join to participate in discussions and see message history.
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <motion.button
              onClick={handleJoin}
              disabled={isJoining}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              whileHover={{ scale: isJoining ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isJoining ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Joining...</span>
                </>
              ) : (
                <>
                  <Hash size={16} />
                  <span>Join Channel</span>
                </>
              )}
            </motion.button>

            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <span className="text-sm">Maybe later</span>
              </button>
            )}
          </div>
        </div>

        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            aria-label="Close banner"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Channel Stats */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-blue-100">
        <div className="flex items-center space-x-4 text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <Clock size={12} />
            <span>Created {new Date(channel.$createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${channel.type === 'public' ? 'bg-green-400' : 'bg-orange-400'}`} />
            <span className="capitalize">{channel.type} channel</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default ChannelJoinBanner 