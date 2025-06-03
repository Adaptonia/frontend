'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'sonner';
import { PWAProvider } from '@/src/context/PWAContext';
// import ServiceWorkerRegistration from './sw-register';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <PWAProvider>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} forcedTheme="light">
          {children}
          <Toaster position="bottom-center" />
            {/* <ServiceWorkerRegistration /> */}
        </ThemeProvider>
      </PWAProvider>
    </AuthProvider>
  );
} 