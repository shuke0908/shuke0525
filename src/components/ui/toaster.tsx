"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: 'default' | 'destructive' | 'success' | 'warning';
  duration?: number;
}

interface ToasterContextType {
  toasts: Toast[];
  toast: (toast: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const ToasterContext = createContext<ToasterContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToasterContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToasterProvider');
  }
  return context;
};

export const ToasterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((toastData: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toastData, id };
    
    setToasts(prev => [...prev, newToast]);

    // 자동 제거 (기본 5초)
    const duration = toastData.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        dismiss(id);
      }, duration);
    }
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  const value: ToasterContextType = {
    toasts,
    toast,
    dismiss,
    dismissAll,
  };

  return (
    <ToasterContext.Provider value={value}>
      {children}
      <Toaster />
    </ToasterContext.Provider>
  );
};

const ToastComponent: React.FC<{ toast: Toast; onDismiss: (id: string) => void }> = ({ 
  toast, 
  onDismiss 
}) => {
  const variantStyles = {
    default: 'bg-background-secondary border-border-primary text-text-primary',
    destructive: 'bg-danger-red/10 border-danger-red/20 text-danger-red',
    success: 'bg-success-green/10 border-success-green/20 text-success-green',
    warning: 'bg-warning-yellow/10 border-warning-yellow/20 text-warning-yellow',
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border backdrop-blur-sm',
        'shadow-lg transition-all duration-300 ease-in-out',
        'animate-in slide-in-from-right-full',
        variantStyles[toast.variant || 'default']
      )}
    >
      <div className="flex-1">
        {toast.title && (
          <div className="font-semibold text-sm mb-1">{toast.title}</div>
        )}
        {toast.description && (
          <div className="text-sm opacity-90">{toast.description}</div>
        )}
        {toast.action && (
          <div className="mt-2">{toast.action}</div>
        )}
      </div>
      
      <button
        onClick={() => onDismiss(toast.id)}
        className="opacity-70 hover:opacity-100 transition-opacity"
        aria-label="닫기"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M1 1L13 13M1 13L13 1"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
};

export const Toaster: React.FC = () => {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full space-y-2">
      {toasts.map(toast => (
        <ToastComponent
          key={toast.id}
          toast={toast}
          onDismiss={dismiss}
        />
      ))}
    </div>
  );
};

export default Toaster;
