'use client';

import { ReactNode, useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/context/AuthContext';
import { WebSocketProvider } from '@/context/WebSocketContext';
import { Toaster } from 'sonner';
import { PWAProvider } from '@/src/context/PWAContext';
import ServiceWorkerRegistration from './sw-register';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <PWAProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
            <Toaster position="bottom-center" />
            <ServiceWorkerRegistration />
          </ThemeProvider>
        </PWAProvider>
      </WebSocketProvider>
    </AuthProvider>
  );
} 