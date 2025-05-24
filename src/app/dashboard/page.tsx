'use client';

import React from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <Loader2 className='h-8 w-8 animate-spin text-primary mx-auto' />
          <p className='mt-4 text-lg text-muted-foreground'>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold mb-2'>
          Welcome back, {user.firstName || 'User'}!
        </h1>
        <p className='text-muted-foreground'>
          Manage your trading portfolio and monitor market activity.
        </p>
      </div>

      {/* Dashboard Content */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {/* Account Balance Card */}
        <div className='bg-card rounded-lg border p-6'>
          <h3 className='text-lg font-semibold mb-2'>Account Balance</h3>
          <p className='text-3xl font-bold text-primary'>
            ${parseFloat(user.balance).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <p className='text-sm text-muted-foreground mt-1'>Available for trading</p>
        </div>

        {/* Account Status Card */}
        <div className='bg-card rounded-lg border p-6'>
          <h3 className='text-lg font-semibold mb-2'>Account Status</h3>
          <div className='space-y-2'>
            <div className='flex justify-between'>
              <span className='text-sm text-muted-foreground'>Email:</span>
              <span className='text-sm'>{user.email}</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-sm text-muted-foreground'>Role:</span>
              <span className='text-sm capitalize'>{user.role}</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-sm text-muted-foreground'>Status:</span>
              <span className='text-sm text-green-600'>Active</span>
            </div>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className='bg-card rounded-lg border p-6'>
          <h3 className='text-lg font-semibold mb-4'>Quick Actions</h3>
          <div className='space-y-2'>
            <button className='w-full text-left px-3 py-2 rounded hover:bg-muted transition-colors'>
              💰 Deposit Funds
            </button>
            <button className='w-full text-left px-3 py-2 rounded hover:bg-muted transition-colors'>
              📈 Start Trading
            </button>
            <button className='w-full text-left px-3 py-2 rounded hover:bg-muted transition-colors'>
              📊 View Portfolio
            </button>
            <button className='w-full text-left px-3 py-2 rounded hover:bg-muted transition-colors'>
              ⚙️ Account Settings
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className='mt-8'>
        <h2 className='text-2xl font-semibold mb-4'>Recent Activity</h2>
        <div className='bg-card rounded-lg border'>
          <div className='p-6 text-center text-muted-foreground'>
            <p>No recent activity to display.</p>
            <p className='text-sm mt-1'>Start trading to see your activity here.</p>
          </div>
        </div>
      </div>
    </div>
  );
} 