'use client'
import React, { ReactNode } from 'react';
import { IconSidebar } from './IconSidebar';
import BottomNav from '../dashboard/BottomNav';
// import BottomNav from '../reuseable/BottomNav';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="app-container">
      <div className="flex overflow-hidden pt-16">
        {/* Icon Sidebar (Left) - stays fixed */}
        <div className="sticky top-0 h-screen">
          <IconSidebar />
        </div>
        
        {/* Main Content - this is what changes between pages */}
        <div className="flex-grow scrollable">
          {children}
        </div>
      </div>
      
      {/* Bottom navigation */}
      <BottomNav />
    </div>
  );
} 