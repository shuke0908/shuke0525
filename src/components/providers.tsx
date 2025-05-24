'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './auth/AuthProvider';
import { Toaster } from './ui/toaster';

// QueryClient 인스턴스를 외부에서 생성하여 SSR과 client 간 일관성 유지
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1분
      retry: (failureCount, error) => {
        // 인증 오류나 권한 오류의 경우 재시도하지 않음
        if ((error as any)?.status === 401 || (error as any)?.status === 403) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
} 