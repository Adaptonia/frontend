'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Users, 
  UserPlus, 
  UserMinus, 
  Shield, 
  Crown, 
  Search,
  MoreVertical,
 
  Settings
} from 'lucide-react'

interface Member {
  userId: string
  name: string
  email: string
  profilePicture?: string
  role: 'admin' | 'moderator' | 'member'
  joinedAt: string
  lastSeen?: string
  isOnline: boolean
}

interface MemberManagementPanelProps {
  isOpen: boolean
  onClose: () => void
  channelId: string
  channelName: string
  currentUserRole: 'admin' | 'moderator' | 'member'
  members?: Member[]
  onAddMember?: (email: string) => Promise<boolean>
  onRemoveMember?: (userId: string) => Promise<boolean>
  onChangeRole?: (userId: string, role: string) => Promise<boolean>
  onInviteMember?: (email: string, role: string) => Promise<void>
}

const MemberManagementPanel: React.FC<MemberManagementPanelProps> = ({
  isOpen,
  onClose,
  // channelId,
  channelName,
  currentUserRole,
  members = [],
  onAddMember,
  onRemoveMember,
  onChangeRole,
  onInviteMember
}) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedRole, setSelectedRole] = useState<'member' | 'admin'>('member')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isInviting, setIsInviting] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  // Filter members based on search
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members
    
    return members.filter(member =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [members, searchQuery])

  // Use real members or show empty state
  const displayMembers = filteredMembers

  // Handle add member
  const handleAddMember = async () => {
    if (!newMemberEmail.trim() || !onAddMember) return

    setLoading(true)
    try {
      const success = await onAddMember(newMemberEmail.trim())
      if (success) {
        setNewMemberEmail('')
        setShowAddMember(false)
      }
    } catch (error) {
      console.error('Error adding member:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle remove member
  const handleRemoveMember = async (userId: string) => {
    if (!onRemoveMember) return

    const confirmed = window.confirm('Are you sure you want to remove this member?')
    if (!confirmed) return

    setLoading(true)
    try {
      await onRemoveMember(userId)
      setActiveDropdown(null)
    } catch (error) {
      console.error('Error removing member:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle role change
  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!onChangeRole) return

    setLoading(true)
    try {
      await onChangeRole(userId, newRole)
      setActiveDropdown(null)
    } catch (error) {
      console.error('Error changing role:', error)
    } finally {
      setLoading(false)
    }
  }

  // const handleInvite = async () => {
  //   if (!inviteEmail.trim() || !onInviteMember) return

  //   setIsInviting(true)
  //   try {
  //     await onInviteMember(inviteEmail, selectedRole)
  //     setInviteEmail('')
  //     setShowInviteModal(false)
  //     // Show success message or handle in parent
  //   } catch (error) {
  //     console.error('Failed to invite member:', error)
  //     // Show error message
  //   } finally {
  //     setIsInviting(false)
  //   }
  // }

  // Get role icon
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4 text-yellow-500" />
      case 'moderator':
        return <Shield className="w-4 h-4 text-blue-500" />
      default:
        return <Users className="w-4 h-4 text-gray-400" />
    }
  }

  // Get role color
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'text-yellow-600 bg-yellow-50'
      case 'moderator':
        return 'text-blue-600 bg-blue-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  // Can manage member
  const canManageMember = (memberRole: string) => {
    if (currentUserRole === 'admin') return true
    if (currentUserRole === 'moderator' && memberRole === 'member') return true
    return false
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, x: 300 }}
          animate={{ scale: 1, opacity: 1, x: 0 }}
          exit={{ scale: 0.9, opacity: 0, x: 300 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Manage Members</h2>
                <p className="text-sm text-gray-500">#{channelName} • {displayMembers.length} members</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          {/* Controls */}
          <div className="p-6 border-b space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Add Member */}
            {(currentUserRole === 'admin' || currentUserRole === 'moderator') && (
              <AnimatePresence>
                {showAddMember ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="flex space-x-2"
                  >
                    <input
                      type="email"
                      placeholder="Enter email address..."
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddMember()}
                    />
                    <button
                      onClick={handleAddMember}
                      disabled={!newMemberEmail.trim() || loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? 'Adding...' : 'Add'}
                    </button>
                    <button
                      onClick={() => {
                        setShowAddMember(false)
                        setNewMemberEmail('')
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </motion.div>
                ) : (
                  <button
                    onClick={() => setShowAddMember(true)}
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <UserPlus size={16} />
                    <span>Add Member</span>
                  </button>
                )}
              </AnimatePresence>
            )}
          </div>

          {/* Members List */}
          <div className="flex-1 overflow-y-auto max-h-96">
            {displayMembers.map((member) => (
              <div
                key={member.userId}
                className="flex items-center justify-between p-4 border-b hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  {/* Avatar */}
                  <div className="relative">
                    <img
                      src={member.profilePicture || '/api/placeholder/40/40'}
                      alt={member.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    {/* Online indicator */}
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 border-2 border-white rounded-full ${
                      member.isOnline ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                  </div>

                  {/* Member info */}
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">{member.name}</span>
                      {getRoleIcon(member.role)}
                    </div>
                    <div className="text-sm text-gray-500">{member.email}</div>
                    <div className="text-xs text-gray-400">
                      Joined {new Date(member.joinedAt).toLocaleDateString()}
                      {member.lastSeen && !member.isOnline && (
                        <span> • Last seen {new Date(member.lastSeen).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Role badge */}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getRoleColor(member.role)}`}>
                    {member.role}
                  </span>

                  {/* Actions dropdown */}
                  {canManageMember(member.role) && (
                    <div className="relative">
                      <button
                        onClick={() => setActiveDropdown(
                          activeDropdown === member.userId ? null : member.userId
                        )}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <MoreVertical size={16} className="text-gray-400" />
                      </button>

                      <AnimatePresence>
                        {activeDropdown === member.userId && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            className="absolute right-0 mt-1 w-48 bg-white border rounded-lg shadow-lg z-10"
                          >
                            {currentUserRole === 'admin' && (
                              <>
                                <button
                                  onClick={() => handleRoleChange(member.userId, 'moderator')}
                                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2"
                                >
                                  <Shield size={14} />
                                  <span>Make Moderator</span>
                                </button>
                                <button
                                  onClick={() => handleRoleChange(member.userId, 'member')}
                                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2"
                                >
                                  <Users size={14} />
                                  <span>Make Member</span>
                                </button>
                                <div className="border-t" />
                              </>
                            )}
                            <button
                              onClick={() => handleRemoveMember(member.userId)}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                            >
                              <UserMinus size={14} />
                              <span>Remove Member</span>
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {displayMembers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No members found</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t bg-gray-50">
            <div className="text-sm text-gray-500">
              {displayMembers.filter(m => m.isOnline).length} of {displayMembers.length} members online
            </div>
            
            {currentUserRole === 'admin' && (
              <button className="flex items-center space-x-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-white">
                <Settings size={14} />
                <span>Channel Settings</span>
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default MemberManagementPanel 