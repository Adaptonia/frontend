'use client';

import React from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { WebSocketProvider } from '@/context/WebSocketContext';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { PWAProvider } from '@/src/context/PWAContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <PWAProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            {children}
            <Toaster position="bottom-center" />
          </ThemeProvider>
        </PWAProvider>
      </WebSocketProvider>
    </AuthProvider>
  );
} 