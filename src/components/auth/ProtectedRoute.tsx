import React from 'react';
import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { Loader2 } from 'lucide-react';

type ProtectedRouteProps = {
  children: ReactNode;
};

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    );
  }

  if (!isAuthenticated) {
    redirect(`/login?redirect=${encodeURIComponent(pathname)}`);
    return null;
  }

  return <>{children}</>;
}
