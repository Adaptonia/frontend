'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MessageSquare, Users, Globe, Lock } from 'lucide-react'

interface CreateChannelFormData {
  name: string
  description: string
  type: 'public' | 'private'
  memberLimit?: number
}

interface CreateChannelModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateChannelFormData) => void
}

const CreateChannelModal: React.FC<CreateChannelModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState<CreateChannelFormData>({
    name: '',
    description: '',
    type: 'public',
    memberLimit: undefined
  })
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: '',
        description: '',
        type: 'public',
        memberLimit: undefined
      })
      setErrors({})
      setIsSubmitting(false)
    }
  }, [isOpen])

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {}

    // Channel name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Channel name is required'
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Channel name must be at least 3 characters'
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Channel name must be less than 50 characters'
    } else if (!/^[a-zA-Z0-9\s-_]+$/.test(formData.name.trim())) {
      newErrors.name = 'Channel name can only contain letters, numbers, spaces, hyphens, and underscores'
    }

    // Member limit validation (if provided)
    if (formData.memberLimit !== undefined && formData.memberLimit < 1) {
      newErrors.memberLimit = 'Member limit must be at least 1'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    
    try {
      // Clean the data before submitting
      const cleanedData: CreateChannelFormData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        type: formData.type,
        memberLimit: formData.memberLimit || undefined
      }
      
      await onSubmit(cleanedData)
      onClose()
    } catch (error) {
      console.error('Error creating channel:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: 20
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: 'easeOut'
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: 20,
      transition: {
        duration: 0.2,
        ease: 'easeIn'
      }
    }
  }

  const overlayVariants = {
    hidden: {
      opacity: 0
    },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.2
      }
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.2
      }
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleOverlayClick}
          />

          {/* Modal */}
          <motion.div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Create Channel
                </h2>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Channel Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Channel Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. general-discussion"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What's this channel about?"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Channel Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Channel Type
                </label>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="channelType"
                      value="public"
                      checked={formData.type === 'public'}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as 'public' | 'private' })}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex items-center space-x-2">
                      <Globe size={16} className="text-gray-500" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">Public</div>
                        <div className="text-xs text-gray-500">Everyone can see and join this channel</div>
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="channelType"
                      value="private"
                      checked={formData.type === 'private'}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as 'public' | 'private' })}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex items-center space-x-2">
                      <Lock size={16} className="text-gray-500" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">Private</div>
                        <div className="text-xs text-gray-500">Only invited members can see this channel</div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Member Limit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Member Limit (Optional)
                </label>
                <div className="relative">
                  <Users size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    value={formData.memberLimit || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      memberLimit: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                    placeholder="No limit"
                    min="1"
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.memberLimit ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.memberLimit && (
                  <p className="mt-1 text-sm text-red-600">{errors.memberLimit}</p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Creating...' : 'Create Channel'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default CreateChannelModal 
