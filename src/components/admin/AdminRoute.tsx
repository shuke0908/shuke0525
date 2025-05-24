import React from 'react';
import type { ReactNode } from 'react';
import { Redirect, useLocation } from 'wouter';
import { useAuth } from '../auth/AuthProvider';
import { Loader2 } from 'lucide-react';

type AdminRouteProps = {
  children: ReactNode;
};

export default function AdminRoute({ children }: AdminRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to={`/login?redirect=${encodeURIComponent(location)}`} />;
  }

  if (!isAdmin) {
    return <Redirect to='/' />;
  }

  // Always wrap admin pages with AdminLayout to ensure consistent sidebar
  return <>{children}</>;
}
