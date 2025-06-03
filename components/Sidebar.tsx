'use client'

import React from 'react'
import { MessageSquare, Database, Plus } from 'lucide-react'

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  notificationCount?: number
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, notificationCount = 32 }) => {
  const tabs = [
    { id: 'chat', icon: MessageSquare },
    { id: 'channels', icon: Database },
    { id: 'add', icon: Plus },
  ]

  return (
    <div className="w-20 flex flex-col items-center justify-center space-y-4 mt-16">
      {tabs.map(({ id, icon: Icon }, index) => (
        <div key={id} className="relative flex flex-col items-center">
          <button
            onClick={() => onTabChange(id)}
            className={`p-3 rounded-xl transition-all duration-200 ${
              activeTab === id
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm'
            }`}
          >
            <Icon size={24} />
          </button>
          
          {/* Notification badge for channels tab */}
          {id === 'channels' && notificationCount && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              {notificationCount}
            </div>
          )}
          
          {/* Connection dot for channels tab */}
          {id === 'channels' && (
            <div className="mt-2 w-2 h-2 bg-gray-400 rounded-full"></div>
          )}
        </div>
      ))}
    </div>
  )
}

export default Sidebar
