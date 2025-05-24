import React from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  LineChart,
  BrainCircuit,
  Wallet,
  Settings,
  BarChart4,
  UserCheck,
} from 'lucide-react';

import Navbar from './Navbar';
import { useAuth } from '@/components/auth/AuthProvider';

interface User {
  role?: string;
  profileImageUrl?: string | null;
  email?: string | null;
  username?: string | null;
}

type LayoutProps = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
};

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
};

const Layout = ({ children, title, subtitle }: LayoutProps) => {
  const [location] = useLocation();
  const { user } = useAuth();

  // Cast user to our User interface
  const userData = user as User | undefined;

  const isAdmin = userData?.role === 'admin' || userData?.role === 'superadmin';

  const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Flash Trade', href: '/flash-trade', icon: LineChart },
    { label: 'Quant AI', href: '/quant-ai', icon: BrainCircuit },
    { label: 'Wallet', href: '/wallet', icon: Wallet },
    { label: 'KYC Verification', href: '/kyc-verification', icon: UserCheck },
    { label: 'Settings', href: '/settings', icon: Settings },
    { label: 'Admin', href: '/admin', icon: BarChart4, adminOnly: true },
  ];

  const filteredNavItems = navItems.filter(
    item => !item.adminOnly || (item.adminOnly && isAdmin)
  );

  const isActive = (href: string) => {
    if (href === '/dashboard' && location === '/dashboard') return true;
    if (href !== '/' && location.startsWith(href)) return true;
    return false;
  };

  return (
    <div className='flex flex-col min-h-screen bg-background'>
      {/* New top navigation bar */}
      <Navbar />

      <div className='flex flex-1'>
        {/* Sidebar for desktop */}
        <aside className='z-30 hidden md:flex md:w-64 flex-col fixed inset-y-0 top-16'>
          <div className='flex flex-col flex-grow border-r bg-card px-4 py-5 h-[calc(100vh-4rem)]'>
            <nav className='flex-1 space-y-1'>
              {filteredNavItems.map(item => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive(item.href) ? 'default' : 'ghost'}
                    className={cn(
                      'w-full justify-start text-sm font-medium mb-1',
                      isActive(item.href)
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground'
                    )}
                  >
                    <item.icon className='h-5 w-5 mr-3' />
                    {item.label}
                  </Button>
                </Link>
              ))}
            </nav>

            <div className='mt-auto pt-4'>
              <div className='px-3 py-2 flex items-center justify-center'>
                <ModeToggle />
              </div>
            </div>
          </div>
        </aside>

        {/* Main content area */}
        <main className='flex-1 md:pl-64 pt-16 md:pt-16'>
          <div className='container mx-auto p-4 md:p-6 max-w-7xl'>
            {/* Page header */}
            {(title || subtitle) && (
              <header className='mb-8 mt-4'>
                {title && <h1 className='text-3xl font-bold'>{title}</h1>}
                {subtitle && (
                  <p className='text-muted-foreground mt-1'>{subtitle}</p>
                )}
              </header>
            )}

            {/* Page content */}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
