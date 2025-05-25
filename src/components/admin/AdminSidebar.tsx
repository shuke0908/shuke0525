import React from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth/AuthProvider';
import {
  Home,
  Users,
  ArrowDownToLine,
  ArrowUpFromLine,
  Shield,
  Settings,
  Timer,
  LogOut,
  BarChart3,
  MessageSquare,
  Activity,
  BarChart4,
  Coins,
  Gift,
  Bell,
  UserCog,
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';

export default function AdminSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  // Add debug log
  console.log(
    'Rendering AdminSidebar with location:',
    location,
    'and user:',
    user?.role
  );

  // Pending requests counts for badges
  const pendingCounts = {
    kyc: 24,
    deposits: 16,
    withdrawals: 12,
    support: 8,
  };

  // Group menu items by categories
  const dashboardItems = [
    {
      name: 'Dashboard',
      path: '/admin',
      icon: Home,
      badge: null,
    },
  ];

  const monitoringItems = [
    {
      name: 'Flash Trade Control',
      path: '/admin/flash-trade-control',
      icon: Timer,
      badge: 2,
    },
    {
      name: 'Active Investments',
      path: '/admin/quant-ai',
      icon: BarChart3,
      badge: 5,
    },
  ];

  const requestsItems = [
    {
      name: 'KYC Verifications',
      path: '/admin/kyc',
      icon: Shield,
      badge: pendingCounts.kyc,
    },
    {
      name: 'Deposits',
      path: '/admin/deposits',
      icon: ArrowDownToLine,
      badge: pendingCounts.deposits,
    },
    {
      name: 'Withdrawals',
      path: '/admin/withdrawals',
      icon: ArrowUpFromLine,
      badge: pendingCounts.withdrawals,
    },
    {
      name: 'Support Tickets',
      path: '/admin/support',
      icon: MessageSquare,
      badge: pendingCounts.support,
    },
  ];

  const managementItems = [
    {
      name: 'Users',
      path: '/admin/users',
      icon: Users,
      badge: null,
    },
    {
      name: 'Admin Access',
      path: '/admin/access',
      icon: UserCog,
      badge: null,
    },
  ];

  const settingsItems = [
    {
      name: 'Flash Trade Settings',
      path: '/admin/flash-trade-settings',
      icon: Activity,
      badge: null,
    },
    {
      name: 'Quant AI Settings',
      path: '/admin/quant-ai-settings',
      icon: BarChart4,
      badge: null,
    },
    {
      name: 'Supported Coins',
      path: '/admin/coins',
      icon: Coins,
      badge: null,
    },
    {
      name: 'Bonus Programs',
      path: '/admin/bonus',
      icon: Gift,
      badge: null,
    },
    {
      name: 'Security Settings',
      path: '/admin/security',
      icon: Shield,
      badge: null,
    },
    {
      name: 'Notifications',
      path: '/admin/notifications',
      icon: Bell,
      badge: null,
    },
    {
      name: 'System Settings',
      path: '/admin/settings',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <div className='w-64 h-screen sticky top-0 bg-card border-r overflow-y-auto'>
      <div className='p-4'>
        <div className='flex items-center space-x-2 mb-6'>
          <div className='h-9 w-9 rounded-md bg-primary flex items-center justify-center'>
            <Shield className='h-5 w-5 text-white' />
          </div>
          <div>
            <h2 className='text-lg font-bold'>Admin Panel</h2>
            <p className='text-xs text-muted-foreground'>
              {user?.role === 'superadmin'
                ? 'Super Administrator'
                : 'Administrator'}
            </p>
          </div>
        </div>

        <nav className='space-y-6'>
          {/* Dashboard Section */}
          <div className='space-y-1'>
            {dashboardItems.map(item => {
              const Icon = item.icon;
              const isActive = location === item.path;

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={cn(
                    'flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  )}
                >
                  <span className='flex items-center'>
                    <Icon className='mr-3 h-4 w-4' />
                    {item.name}
                  </span>
                  {item.badge && (
                    <Badge className='ml-auto bg-red-500'>{item.badge}</Badge>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Monitoring Section */}
          <div>
            <h3 className='text-xs uppercase font-semibold px-3 mb-2 text-muted-foreground'>
              Monitoring
            </h3>
            <div className='space-y-1'>
              {monitoringItems.map(item => {
                const Icon = item.icon;
                const isActive = location === item.path;

                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={cn(
                      'flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-muted'
                    )}
                  >
                    <span className='flex items-center'>
                      <Icon className='mr-3 h-4 w-4' />
                      {item.name}
                    </span>
                    {item.badge && (
                      <Badge className='ml-auto bg-orange-500'>
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Requests Section */}
          <div>
            <h3 className='text-xs uppercase font-semibold px-3 mb-2 text-muted-foreground'>
              Pending Requests
            </h3>
            <div className='space-y-1'>
              {requestsItems.map(item => {
                const Icon = item.icon;
                const isActive = location === item.path;

                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={cn(
                      'flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-muted'
                    )}
                  >
                    <span className='flex items-center'>
                      <Icon className='mr-3 h-4 w-4' />
                      {item.name}
                    </span>
                    {item.badge && item.badge > 0 && (
                      <Badge className='ml-auto bg-red-500'>{item.badge}</Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Management Section */}
          <div>
            <h3 className='text-xs uppercase font-semibold px-3 mb-2 text-muted-foreground'>
              Management
            </h3>
            <div className='space-y-1'>
              {managementItems.map(item => {
                const Icon = item.icon;
                const isActive = location === item.path;

                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={cn(
                      'flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-muted'
                    )}
                  >
                    <span className='flex items-center'>
                      <Icon className='mr-3 h-4 w-4' />
                      {item.name}
                    </span>
                    {item.badge && (
                      <Badge className='ml-auto'>{item.badge}</Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Settings Section */}
          <Collapsible className='w-full'>
            <h3 className='text-xs uppercase font-semibold px-3 mb-2 text-muted-foreground'>
              Settings
            </h3>
            <CollapsibleTrigger className='flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors w-full text-left text-foreground hover:bg-muted'>
              <span className='flex items-center'>
                <Settings className='mr-3 h-4 w-4' />
                Platform Settings
              </span>
            </CollapsibleTrigger>
            <CollapsibleContent className='pl-3 space-y-1 mt-1'>
              {settingsItems.map(item => {
                const Icon = item.icon;
                const isActive = location === item.path;

                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={cn(
                      'flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-muted'
                    )}
                  >
                    <span className='flex items-center'>
                      <Icon className='mr-3 h-4 w-4' />
                      {item.name}
                    </span>
                    {item.badge && (
                      <Badge className='ml-auto'>{item.badge}</Badge>
                    )}
                  </Link>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        </nav>
      </div>

      <div className='sticky bottom-0 w-full p-4 bg-card border-t mt-6'>
        <Link
          href='/'
          className='flex items-center px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md transition-colors'
        >
          <LogOut className='mr-3 h-4 w-4' />
          Exit Admin Panel
        </Link>
      </div>
    </div>
  );
}
