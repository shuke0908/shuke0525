import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { Home, Clock, Bot, Wallet, ShieldCheck } from 'lucide-react';

const MobileNav = () => {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path;
  };

  const navItems = [
    { path: '/dashboard', label: 'Home', icon: <Home className='text-lg' /> },
    {
      path: '/flash-trade',
      label: 'Flash',
      icon: <Clock className='text-lg' />,
    },
    { path: '/quant-ai', label: 'Quant', icon: <Bot className='text-lg' /> },
    { path: '/wallet', label: 'Wallet', icon: <Wallet className='text-lg' /> },
    {
      path: '/kyc-verification',
      label: 'KYC',
      icon: <ShieldCheck className='text-lg' />,
    },
  ];

  return (
    <div className='md:hidden fixed bottom-0 left-0 right-0 bg-muted border-t border-border py-2 px-6 z-40'>
      <div className='flex justify-between items-center'>
        {navItems.map(item => (
          <Link
            key={item.path}
            href={item.path}
            className='flex flex-col items-center'
          >
            <div
              className={cn(
                'flex flex-col items-center',
                isActive(item.path) ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {item.icon}
              <span className='text-xs mt-1'>{item.label}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default MobileNav;
