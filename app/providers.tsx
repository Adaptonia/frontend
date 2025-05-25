'use client';

import { ReactNode, useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import { registerServiceWorker } from '@/src/lib/pwa';

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
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  );
} 