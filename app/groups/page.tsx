'use client'
import React from 'react';
import ChannelList from '@/components/channel/ChannelList';
import { motion } from 'framer-motion';

export default function GroupsPage() {
  return (
    <div className="flex h-full">
      {/* Channel List Sidebar */}
      <div className="flex-shrink-0 w-72 border-r rounded-tl-3xl border-gray-200 dark:border-gray-800 scrollable">
        <ChannelList />
      </div>

      {/* Main Content Area (Right - placeholder) */}
      <div className="flex-grow bg-white dark:bg-gray-900 scrollable">
        {/* Content for the selected channel would go here */}
        <div className="p-6">
          <motion.h1 
            className="text-2xl font-bold"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            Select a channel
          </motion.h1>
          <motion.p 
            className="text-gray-500"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            Channel messages will appear here.
          </motion.p>
        </div>
      </div>
    </div>
  );
} 