'use client'

import React, { useState } from 'react'
import { Search, Plus, MessageSquare } from 'lucide-react'

interface Contact {
  id: string
  name: string
  lastMessage?: string
  timestamp?: string
  unreadCount?: number
  isOnline?: boolean
  avatar?: string
}

interface ChatListProps {
  contacts: Contact[]
  onContactSelect: (contactId: string) => void
  onAddContacts: () => void
}

const ChatList: React.FC<ChatListProps> = ({ contacts, onContactSelect, onAddContacts }) => {
  const [searchQuery, setSearchQuery] = useState('')

  // Filter contacts based on search query
  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex-1 bg-white flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">Direct Messages</h1>
          <button
            onClick={onAddContacts}
            className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Online Contacts - Show only if there are contacts */}
      {contacts.length > 0 && (
        <div className="p-4 border-b">
          <h2 className="text-sm font-medium text-gray-600 mb-3">Online Now</h2>
          <div className="flex space-x-3 overflow-x-auto">
            {contacts.filter(contact => contact.isOnline).slice(0, 10).map((contact) => (
              <button
                key={contact.id}
                onClick={() => onContactSelect(contact.id)}
                className="flex-shrink-0 text-center group"
              >
                <div className="relative">
                  {contact.avatar ? (
                    <img
                      src={contact.avatar}
                      alt={contact.name}
                      className="w-12 h-12 rounded-full object-cover mb-1"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-white text-sm font-semibold mb-1">
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="absolute bottom-1 right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <span className="text-xs text-gray-600 group-hover:text-gray-900 block max-w-[60px] truncate">
                  {contact.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Contact List */}
      <div className="flex-1 overflow-y-auto">
        {filteredContacts.length > 0 ? (
          filteredContacts.map((contact) => (
            <button
              key={contact.id}
              onClick={() => onContactSelect(contact.id)}
              className="w-full p-4 flex items-center space-x-3 hover:bg-gray-50 border-b border-gray-100 transition-colors"
            >
              <div className="relative">
                {contact.avatar ? (
                  <img
                    src={contact.avatar}
                    alt={contact.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-white text-sm font-semibold">
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                )}
                {contact.isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                )}
              </div>

              <div className="flex-1 text-left">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{contact.name}</span>
                  {contact.timestamp && (
                    <span className="text-xs text-gray-500">{contact.timestamp}</span>
                  )}
                </div>
                {contact.lastMessage && (
                  <p className="text-sm text-gray-600 truncate mt-1">
                    {contact.lastMessage}
                  </p>
                )}
              </div>

              {contact.unreadCount && contact.unreadCount > 0 && (
                <div className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                  {contact.unreadCount}
                </div>
              )}
            </button>
          ))
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts yet</h3>
              <p className="text-gray-600 mb-4">Start by adding some contacts to begin messaging</p>
              <button
                onClick={onAddContacts}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Add Contacts
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatList 