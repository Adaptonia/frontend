'use client'
import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { AnimatePresence, motion } from 'framer-motion';

export default function GroupsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayout>
      <AnimatePresence mode="wait">
        <motion.div
          key={`groups-content-${Math.random()}`} // Force re-render on navigation
          className="w-full h-full"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </AppLayout>
  );
} 