import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { NotificationCenter } from '@/components/NotificationCenter';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { TopNavItems } from '@/components/TopNavItems';
import { MobileNavItems } from './MobileNavItems';
import { MobileNavAdminItems } from './MobileNavAdmin';
import { languages } from '@/lib/i18n';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  LogOut,
  User as UserIcon,
  Settings,
  Menu,
  BarChart3,
  Wallet,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import Image from 'next/image';

interface User {
  firstName?: string | null;
  email?: string | null;
  role?: string;
}

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  // Cast user to our User interface
  const userData = user as User | undefined;

  // This is used to display the user's name or email in the UI
  const displayName =
    userData?.firstName || userData?.email?.split('@')[0] || t('common.user');

  // Check if user is an admin
  const isAdmin = userData?.role === 'admin' || userData?.role === 'superadmin';

  return (
    <nav className='border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
      <div className='mx-auto max-w-screen-xl px-4 py-3'>
        <div className='flex items-center justify-between'>
          {/* Logo */}
          <Link href='/' className='flex items-center gap-2'>
            <div className='font-bold text-xl text-primary'>CryptoTrader</div>
          </Link>

          {/* Desktop Nav */}
          <div className='hidden md:flex md:items-center md:gap-8'>
            {isAuthenticated && <TopNavItems />}
          </div>

          {/* Language Switcher */}
          <div className='hidden md:flex'>
            <LanguageSwitcher variant='outline' size='sm' className='ml-auto' />
          </div>

          {/* Auth Buttons */}
          <div className='flex items-center gap-2'>
            {isAuthenticated ? (
              <div className='flex items-center gap-2'>
                {/* Notification Center */}
                {isAuthenticated && (
                  <div className='hidden md:block'>
                    <NotificationCenter />
                  </div>
                )}

                {/* Admin Menu */}
                {isAdmin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant='outline'
                        size='sm'
                        className='hidden md:flex'
                      >
                        {t('nav.admin')}{' '}
                        <ChevronDown className='ml-1 w-4 h-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuLabel>
                        {t('nav.adminPanel')}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <Link href='/admin'>
                        <DropdownMenuItem>
                          <BarChart3 className='mr-2 h-4 w-4' />
                          <span>{t('nav.dashboard')}</span>
                        </DropdownMenuItem>
                      </Link>
                      <Link href='/admin/users'>
                        <DropdownMenuItem>
                          <UserIcon className='mr-2 h-4 w-4' />
                          <span>{t('nav.users')}</span>
                        </DropdownMenuItem>
                      </Link>
                      <Link href='/admin/deposits'>
                        <DropdownMenuItem>
                          <Wallet className='mr-2 h-4 w-4' />
                          <span>{t('nav.deposits')}</span>
                        </DropdownMenuItem>
                      </Link>
                      <Link href='/admin/withdrawals'>
                        <DropdownMenuItem>
                          <Wallet className='mr-2 h-4 w-4' />
                          <span>{t('nav.withdrawals')}</span>
                        </DropdownMenuItem>
                      </Link>
                      <Link href='/admin/kyc'>
                        <DropdownMenuItem>
                          <ShieldCheck className='mr-2 h-4 w-4' />
                          <span>{t('nav.kycVerification')}</span>
                        </DropdownMenuItem>
                      </Link>
                      <Link href='/admin/settings'>
                        <DropdownMenuItem>
                          <Settings className='mr-2 h-4 w-4' />
                          <span>{t('nav.settings')}</span>
                        </DropdownMenuItem>
                      </Link>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='outline' className='gap-2 hidden md:flex'>
                      <UserIcon className='h-4 w-4' />
                      <span>{displayName}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuLabel>{t('nav.myAccount')}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <Link href='/settings'>
                      <DropdownMenuItem>
                        <Settings className='mr-2 h-4 w-4' />
                        <span>{t('nav.settings')}</span>
                      </DropdownMenuItem>
                    </Link>
                    <Link href='/kyc-verification'>
                      <DropdownMenuItem>
                        <ShieldCheck className='mr-2 h-4 w-4' />
                        <span>{t('nav.kycVerification')}</span>
                      </DropdownMenuItem>
                    </Link>
                    <Link href='/wallet'>
                      <DropdownMenuItem>
                        <Wallet className='mr-2 h-4 w-4' />
                        <span>{t('nav.wallet')}</span>
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        // Use the API to log out
                        fetch('/api/logout', {
                          method: 'POST',
                          credentials: 'include',
                        })
                          .then(() => {
                            // Clear React Query cache
                            window.location.href = '/login';
                          })
                          .catch(err => {
                            console.error('Logout error:', err);
                            // Fallback if API fails
                            window.location.href = '/login';
                          });
                      }}
                    >
                      <LogOut className='mr-2 h-4 w-4' />
                      <span>{t('nav.logout')}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Mobile Menu Button */}
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button size='icon' variant='outline' className='md:hidden'>
                      <Menu className='h-5 w-5' />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side='right'>
                    <div className='flex flex-col gap-6 mt-8'>
                      <div className='border-b pb-4'>
                        <div className='font-medium mb-2'>
                          Welcome, {displayName}!
                        </div>
                        <div className='text-sm text-muted-foreground'>
                          {userData?.email}
                        </div>
                      </div>
                      {/* Mobile Notification Center */}
                      <div className='mb-4'>
                        <NotificationCenter />
                      </div>

                      <div className='flex flex-col gap-4'>
                        <MobileNavItems onItemClick={closeMobileMenu} />
                      </div>

                      {/* Admin Links */}
                      {isAdmin && (
                        <MobileNavAdminItems onItemClick={closeMobileMenu} />
                      )}

                      {/* Language Switcher in mobile menu */}
                      <div className='border-t pt-4 mb-4'>
                        <div className='font-medium mb-3'>
                          {t('nav.language')}
                        </div>
                        <div className='grid grid-cols-2 gap-2'>
                          {languages.map(lang => (
                            <button
                              key={lang.code}
                              onClick={() => {
                                i18n.changeLanguage(lang.code);
                                closeMobileMenu();
                              }}
                              className={`flex items-center p-2 rounded ${
                                i18n.language === lang.code
                                  ? 'bg-primary/10 font-medium'
                                  : 'hover:bg-muted'
                              }`}
                            >
                              <Image
                                src={`/flags/${lang.flagCode}.svg`}
                                alt=""
                                width={16}
                                height={12}
                                className="h-4 w-6 mr-2 rounded-sm object-cover"
                              />
                              <span>{lang.nativeName}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className='border-t pt-4'>
                        <div
                          className='cursor-pointer'
                          onClick={() => {
                            // Use the API to log out
                            fetch('/api/logout', {
                              method: 'POST',
                              credentials: 'include',
                            })
                              .then(() => {
                                closeMobileMenu();
                                // Clear React Query cache
                                window.location.href = '/login';
                              })
                              .catch(err => {
                                console.error('Logout error:', err);
                                closeMobileMenu();
                                // Fallback if API fails
                                window.location.href = '/login';
                              });
                          }}
                        >
                          <div className='flex items-center gap-3 text-foreground hover:text-primary'>
                            <LogOut className='h-5 w-5' />
                            <span>{t('nav.logout')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            ) : (
              <>
                <Link href='/login'>
                  <Button>{t('nav.login')}</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
