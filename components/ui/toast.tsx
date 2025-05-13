'use client';

import React, { createContext, useContext, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastProps = {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: 'default' | 'destructive';
  duration?: number;
  onClose: () => void;
};

export type ToastActionElement = React.ReactElement<{
  altText: string;
}>;

type ToasterToast = ToastProps & {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: 'default' | 'destructive';
};

type ToastContextType = {
  toast: (props: Omit<ToasterToast, 'id' | 'onClose'>) => void;
  dismissToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function Toast({
  id,
  title,
  description,
  action,
  variant = 'default',
  onClose,
}: ToastProps) {
  return (
    <div
      className={cn(
        'pointer-events-auto relative flex w-full max-w-md items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all',
        variant === 'default' ? 'bg-white text-black' : 'bg-red-600 text-white'
      )}
    >
      <div className="flex-1">
        {title && <div className="font-medium">{title}</div>}
        {description && <div className="mt-1 text-sm">{description}</div>}
      </div>
      {action}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-2 right-2 p-1 rounded-md"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToasterToast[]>([]);

  const toast = (props: Omit<ToasterToast, 'id' | 'onClose'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { id, ...props } as ToasterToast;
    
    setToasts((currentToasts) => [...currentToasts, newToast]);
    
    if (props.duration !== Infinity) {
      setTimeout(() => {
        dismissToast(id);
      }, props.duration || 5000);
    }
  };

  const dismissToast = (id: string) => {
    setToasts((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== id)
    );
  };

  return (
    <ToastContext.Provider value={{ toast, dismissToast }}>
      {children}
      
      {/* Toast container */}
      <div className="fixed top-0 right-0 z-50 flex flex-col gap-2 w-full max-w-md p-4 sm:right-0 sm:top-0 sm:flex-col">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            title={toast.title}
            description={toast.description}
            action={toast.action}
            variant={toast.variant}
            onClose={() => dismissToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return context;
} 