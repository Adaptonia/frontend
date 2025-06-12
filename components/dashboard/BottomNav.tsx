'use client'

import React from 'react'
import { Home, Users, CalendarDays } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const BottomNav = () => {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t pb-safe">
      <div className="mx-4 mb-4 bg-white border-gray-100 py-3 px-6 flex justify-between items-center">
        <Link href="/dashboard" className="flex flex-col items-center">
          <div className={`p-2 rounded-full ${isActive('/dashboard') ? 'bg-blue-100' : 'bg-gray-100'}`}>
            <Home className={`w-5 h-5 ${isActive('/dashboard') ? 'text-blue-500' : 'text-gray-400'}`} />
          </div>
          {isActive('/dashboard') && <div className="w-1 h-1 bg-blue-500 rounded-full mt-1"></div>}
        </Link>
        
        <Link href="/groups" className="flex flex-col items-center">
          <div className={`p-2 rounded-full ${isActive('/groups') ? 'bg-blue-100' : 'bg-gray-100'}`}>
            <Users className={`w-5 h-5 ${isActive('/groups') ? 'text-blue-500' : 'text-gray-400'}`} />
          </div>
          {isActive('/groups') && <div className="w-1 h-1 bg-blue-500 rounded-full mt-1"></div>}
        </Link>
        
        <Link href="/explore" className="flex flex-col items-center">
          <div className={`p-2 rounded-full ${isActive('/explore') ? 'bg-blue-100' : 'bg-gray-100'}`}>
            <CalendarDays className={`w-5 h-5 ${isActive('/explore') ? 'text-blue-500' : 'text-gray-400'}`} />
          </div>
          {isActive('/explore') && <div className="w-1 h-1 bg-blue-500 rounded-full mt-1"></div>}
        </Link>
        
        <Link href="/settings" className="flex flex-col items-center">
          <div className={`w-8 h-8 rounded-full overflow-hidden ${isActive('/settings') ? 'ring-2 ring-blue-500' : ''}`}>
            <Image src="/happy-man.jpg" alt="Profile" width={32} height={32} />
          </div>
          {isActive('/settings') && <div className="w-1 h-1 bg-blue-500 rounded-full mt-1"></div>}
        </Link>
      </div>
    </div>
  )
}

export default BottomNav 