'use client'
import React from 'react';
import { MessageSquare, Plus, Users } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

/**
 * IconSidebar component serves as the main navigation for the app
 * - Message icon navigates to chat UI
 * - Group icon navigates to groups/channels list
 * - Plus icon navigates to join channel page
 * 
 * Implements navigation according to the design mockups with notification badges
 */
export function IconSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  
  // Determine which icon is active based on the current path
  const isChatActive = pathname?.startsWith('/chat') || false;
  const isGroupsActive = pathname?.startsWith('/group') || false;
  
  // For notification badge, we don't want it to animate on every render
  const notificationVariants = {
    initial: { scale: 0.8 },
    animate: { 
      scale: 1,
      transition: { 
        type: "spring", 
        stiffness: 500,
        damping: 15
      }
    }
  };

  return (
    <div className="dark:bg-gray-900 p-3 flex flex-col items-center space-y-6 border-r border-gray-200 dark:border-gray-800 h-full">
      <motion.button 
        className={`p-2 rounded-xl transition-colors ${isChatActive ? 'bg-blue-100 dark:bg-blue-800' : 'hover:bg-gray-200 dark:hover:bg-gray-800'}`}
        onClick={() => !isChatActive && router.push('/chat')}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <MessageSquare className={`h-6 w-6 ${isChatActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`} />
      </motion.button>
      
      <motion.button 
        className={`p-2 rounded-xl relative transition-colors ${isGroupsActive ? 'bg-green-100 dark:bg-green-800' : 'hover:bg-gray-200 dark:hover:bg-gray-800'}`}
        onClick={() => !isGroupsActive && router.push('/groups')}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Users className={`h-6 w-6 ${isGroupsActive ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`} />
        <motion.span 
          className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5"
          initial="initial"
          animate="animate"
          variants={notificationVariants}
        >
          32
        </motion.span>
      </motion.button>
      
      <motion.button 
        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => router.push('/join')}
      >
        <Plus className="h-6 w-6 text-gray-600 dark:text-gray-400" />
      </motion.button>
    </div>
  );
} 
