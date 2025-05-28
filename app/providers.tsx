'use client';

import { ReactNode } from 'react';
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
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} forcedTheme="light">
            {children}
            <Toaster position="bottom-center" />
            <ServiceWorkerRegistration />
          </ThemeProvider>
        </PWAProvider>
      </WebSocketProvider>
    </AuthProvider>
  );
} 