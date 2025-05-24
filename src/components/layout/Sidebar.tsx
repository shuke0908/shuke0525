import { Link, useLocation } from 'wouter';
import { useAuth } from '@/components/auth/AuthProvider';
import { cn } from '@/lib/utils';
import {
  Home,
  Zap,
  Clock,
  Bot,
  Wallet,
  UserCheck,
  Settings,
  LogOut,
  MessageCircle,
  Gift,
} from 'lucide-react';
import Image from 'next/image';

const Sidebar = () => {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const isActive = (path: string) => {
    return location === path;
  };

  const navItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: <Home className='w-5 h-5 mr-3' />,
    },
    {
      path: '/quick-trade',
      label: 'Quick Trade',
      icon: <Zap className='w-5 h-5 mr-3' />,
    },
    {
      path: '/flash-trade',
      label: 'Flash Trade',
      icon: <Clock className='w-5 h-5 mr-3' />,
    },
    {
      path: '/quant-ai',
      label: 'Quant AI',
      icon: <Bot className='w-5 h-5 mr-3' />,
    },
    {
      path: '/wallet',
      label: 'Wallet',
      icon: <Wallet className='w-5 h-5 mr-3' />,
    },
    {
      path: '/kyc-verification',
      label: 'KYC Verification',
      icon: <UserCheck className='w-5 h-5 mr-3' />,
    },
    {
      path: '/support',
      label: 'Live Support',
      icon: <MessageCircle className='w-5 h-5 mr-3' />,
    },
    {
      path: '/settings',
      label: 'Settings',
      icon: <Settings className='w-5 h-5 mr-3' />,
    },
    {
      path: '/bonuses',
      label: 'Bonuses',
      icon: <Gift className='w-5 h-5 mr-3' />,
    },
  ];

  console.log('Sidebar menu items:', navItems);

  // Add admin link if user is admin
  if (user && (user.role === 'admin' || user.role === 'superadmin')) {
    navItems.push({
      path: '/admin',
      label: 'Admin Panel',
      icon: (
        <svg
          className='w-5 h-5 mr-3'
          xmlns='http://www.w3.org/2000/svg'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
        >
          <path d='M12 2L2 7l10 5 10-5-10-5z' />
          <path d='M2 17l10 5 10-5' />
          <path d='M2 12l10 5 10-5' />
        </svg>
      ),
    });
  }

  return (
    <aside className='hidden md:flex flex-col w-64 border-r border-border bg-background'>
      <div className='p-4 border-b border-border'>
        <div className='flex items-center space-x-2'>
          <div className='w-8 h-8 bg-primary rounded-full flex items-center justify-center'>
            <Zap className='h-4 w-4 text-primary-foreground' />
          </div>
          <h1 className='text-xl font-bold'>CryptoTrader Pro</h1>
        </div>
      </div>

      <div className='flex-1 overflow-y-auto py-4 px-3'>
        <nav className='space-y-1'>
          {navItems.map(item => (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isActive(item.path)
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}

          <button
            onClick={() => logoutMutation.mutate()}
            className='w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition-colors'
          >
            <LogOut className='w-5 h-5 mr-3' />
            Logout
          </button>
        </nav>
      </div>

      {user && (
        <div className='p-4 border-t border-border'>
          <div className='flex items-center space-x-2'>
            <div className='relative'>
              {user.profileImage ? (
                <Image
                  src={user.profileImage}
                  alt='Profile'
                  width={40}
                  height={40}
                  className='w-10 h-10 rounded-full object-cover'
                />
              ) : (
                <div className='w-10 h-10 rounded-full bg-muted flex items-center justify-center'>
                  <span className='font-semibold text-lg'>
                    {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                  </span>
                </div>
              )}
              <div className='absolute -top-1 -right-1 bg-primary text-xs text-primary-foreground font-bold rounded-full w-5 h-5 flex items-center justify-center'>
                {user.role === 'admin' || user.role === 'superadmin'
                  ? 'A'
                  : 'U'}
              </div>
            </div>
            <div>
              <p className='text-sm font-medium'>{user.email || 'User'}</p>
              <p className='text-xs text-muted-foreground'>
                Balance: ${parseFloat(user.balance || '0').toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
