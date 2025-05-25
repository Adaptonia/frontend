'use client';

import { ReactNode, useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import { registerServiceWorker } from '@/src/lib/pwa';
import { AuthProvider } from '@/context/AuthContext';
import { WebSocketProvider } from '@/context/WebSocketContext';
import { Toaster } from 'sonner';
import { PWAProvider } from '@/src/context/PWAContext';

export function Providers({ children }: { children: ReactNode }) {
  // Register service worker for PWA functionality
  useEffect(() => {
    registerServiceWorker()
      .then(registration => {
        if (registration) {
          console.log('Service worker registered successfully for PWA');
        }
      })
      .catch(error => {
        console.error('Error registering service worker:', error);
      });
  }, []);

  return (
    <AuthProvider>
      <WebSocketProvider>
        <PWAProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
            <Toaster position="bottom-center" />
          </ThemeProvider>
        </PWAProvider>
      </WebSocketProvider>
    </AuthProvider>
  );
} 