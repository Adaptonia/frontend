'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/context/AuthContext';
import { ChannelCacheProvider } from '@/context/ChannelCacheContext';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ChannelCacheProvider>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} forcedTheme="light">
          {children}
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </ChannelCacheProvider>
    </AuthProvider>
  );
} 
