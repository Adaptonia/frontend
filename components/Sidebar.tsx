'use client'

import React from 'react'
import { MessageCircle, MessageSquare, Plus } from 'lucide-react'

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'chat', icon: MessageCircle },
    { id: 'channels', icon: MessageSquare },
    { id: 'add', icon: Plus },
  ]

  return (
    <div className="w-16 bg-[#1f1f1f] flex flex-col items-center justify-center space-y-4">
      {tabs.map(({ id, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onTabChange(id)}
          className={`p-2 rounded-lg transition-colors ${
            activeTab === id
              ? 'bg-blue-500/10 text-blue-500'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <Icon size={20} />
        </button>
      ))}
    </div>
  )
}

export default Sidebar 