import { useState } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/components/auth/AuthProvider';
import { Menu, Bell } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';

type HeaderProps = {
  onNotificationsClick: () => void;
};

const Header = ({ onNotificationsClick }: HeaderProps) => {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  // Get unread notifications count
  const { data: notifications } = useQuery({
    queryKey: ['/api/notifications'],
    enabled: !!user,
  });

  const unreadNotificationsCount = (notifications as any)?.notifications?.length || 0;

  return (
    <header className='sticky top-0 z-10 bg-background border-b border-border'>
      <div className='px-4 sm:px-6 lg:px-8 py-4'>
        <div className='flex items-center justify-between'>
          {/* Mobile menu & logo */}
          <div className='flex items-center md:hidden'>
            <button
              type='button'
              className='text-foreground mr-3'
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <Menu className='h-6 w-6' />
            </button>
            <Link href='/' className='flex items-center space-x-2'>
              <div className='w-8 h-8 bg-primary rounded-full flex items-center justify-center'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='h-4 w-4 text-primary-foreground'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                >
                  <path d='m6 9 6-3 6 3v6l-6 3-6-3z' />
                  <path d='m6 9 6 3 6-3' />
                  <path d='M6 12v3' />
                  <path d='M12 12v6' />
                  <path d='M18 12v3' />
                </svg>
              </div>
              <h1 className='text-xl font-bold'>CryptoTrader Pro</h1>
            </Link>
          </div>

          {/* Right side navigation elements */}
          <div className='flex items-center space-x-4'>
            {/* Balance */}
            {user && (
              <div className='hidden sm:flex items-center space-x-3'>
                <div className='text-right'>
                  <p className='text-xs text-muted-foreground'>Total Balance</p>
                  <p className='text-sm font-mono font-bold'>
                    $
                    {parseFloat(user.balance || '0').toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div className='px-3 py-1 bg-success/20 rounded-full'>
                  <span className='text-xs font-medium text-success'>
                    +2.4%
                  </span>
                </div>
              </div>
            )}

            {/* Notification bell */}
            <button
              type='button'
              className='relative p-1 text-muted-foreground hover:text-foreground'
              onClick={onNotificationsClick}
            >
              <Bell className='h-5 w-5' />
              {unreadNotificationsCount > 0 && (
                <span className='absolute top-0 right-0 block w-2 h-2 bg-destructive rounded-full'></span>
              )}
            </button>

            {/* User menu - Mobile only */}
            <div className='md:hidden relative'>
              <button
                type='button'
                className='flex items-center space-x-2'
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {(user as any)?.profileImage ? (
                  <Image
                    src={(user as any).profileImage}
                    alt='User profile'
                    width={32}
                    height={32}
                    className='w-8 h-8 rounded-full object-cover'
                  />
                ) : (
                  <div className='w-8 h-8 rounded-full bg-muted flex items-center justify-center'>
                    <span className='font-semibold'>
                      {(user as any)?.firstName?.charAt(0).toUpperCase() || '?'}
                    </span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <div className='md:hidden bg-background border-b border-border'>
          <nav className='px-4 py-3 space-y-2'>
            <Link
              href='/'
              className='block px-3 py-2 rounded-md text-base font-medium hover:bg-muted'
            >
              Dashboard
            </Link>
            <Link
              href='/quick-trade'
              className='block px-3 py-2 rounded-md text-base font-medium hover:bg-muted'
            >
              Quick Trade
            </Link>
            <Link
              href='/flash-trade'
              className='block px-3 py-2 rounded-md text-base font-medium hover:bg-muted'
            >
              Flash Trade
            </Link>
            <Link
              href='/quant-ai'
              className='block px-3 py-2 rounded-md text-base font-medium hover:bg-muted'
            >
              Quant AI
            </Link>
            <Link
              href='/wallet'
              className='block px-3 py-2 rounded-md text-base font-medium hover:bg-muted'
            >
              Wallet
            </Link>
            <Link
              href='/kyc-verification'
              className='block px-3 py-2 rounded-md text-base font-medium hover:bg-muted'
            >
              KYC Verification
            </Link>
            <Link
              href='/settings'
              className='block px-3 py-2 rounded-md text-base font-medium hover:bg-muted'
            >
              Settings
            </Link>

            {user && ((user as any).role === 'admin' || (user as any).role === 'superadmin') && (
              <Link
                href='/admin'
                className='block px-3 py-2 rounded-md text-base font-medium hover:bg-muted'
              >
                Admin Panel
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
