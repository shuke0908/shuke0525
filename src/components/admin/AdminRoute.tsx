import React from 'react';
import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useAuth } from '../auth/AuthProvider';
import { Loader2 } from 'lucide-react';

type AdminRouteProps = {
  children: ReactNode;
};

export default function AdminRoute({ children }: AdminRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
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

  if (!isAdmin) {
    redirect('/');
    return null;
  }

  // Always wrap admin pages with AdminLayout to ensure consistent sidebar
  return <>{children}</>;
}
