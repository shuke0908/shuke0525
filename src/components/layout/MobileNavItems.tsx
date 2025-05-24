import React from 'react';
import { Link } from 'wouter';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Zap,
  Clock,
  Bot,
  Wallet,
  ArrowRightLeft,
  Gift,
  ShieldCheck,
  Settings,
  MessageCircle,
} from 'lucide-react';

interface MobileNavItemProps {
  href: string;
  translationKey: string;
  icon: React.ReactNode;
  onClick?: (() => void) | undefined;
}

export const MobileNavItem: React.FC<MobileNavItemProps> = ({
  href,
  translationKey,
  icon,
  onClick,
}) => {
  const { t } = useTranslation();

  return (
    <Link
      href={href}
      onClick={onClick}
      className='flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors'
    >
      <div className='flex-shrink-0 text-muted-foreground'>{icon}</div>
      <span>{t(translationKey)}</span>
    </Link>
  );
};

interface MobileNavItemsProps {
  onItemClick?: () => void;
}

export const MobileNavItems: React.FC<MobileNavItemsProps> = ({
  onItemClick,
}) => {
  return (
    <div className='flex flex-col gap-1'>
      <MobileNavItem
        href='/dashboard'
        translationKey='nav.dashboard'
        icon={<LayoutDashboard className='h-4 w-4' />}
        onClick={onItemClick}
      />
      <MobileNavItem
        href='/quick-trade'
        translationKey='nav.quickTrade'
        icon={<Zap className='h-4 w-4' />}
        onClick={onItemClick}
      />
      <MobileNavItem
        href='/flash-trade'
        translationKey='nav.flashTrade'
        icon={<Clock className='h-4 w-4' />}
        onClick={onItemClick}
      />
      <MobileNavItem
        href='/quant-ai'
        translationKey='nav.quantAI'
        icon={<Bot className='h-4 w-4' />}
        onClick={onItemClick}
      />
      <MobileNavItem
        href='/wallet'
        translationKey='nav.wallet'
        icon={<Wallet className='h-4 w-4' />}
        onClick={onItemClick}
      />
      <MobileNavItem
        href='/crypto-converter'
        translationKey='nav.converter'
        icon={<ArrowRightLeft className='h-4 w-4' />}
        onClick={onItemClick}
      />
      <MobileNavItem
        href='/bonuses'
        translationKey='nav.bonuses'
        icon={<Gift className='h-4 w-4' />}
        onClick={onItemClick}
      />
      <MobileNavItem
        href='/kyc-verification'
        translationKey='nav.kycVerification'
        icon={<ShieldCheck className='h-4 w-4' />}
        onClick={onItemClick}
      />
      <MobileNavItem
        href='/settings'
        translationKey='nav.settings'
        icon={<Settings className='h-4 w-4' />}
        onClick={onItemClick}
      />
      <MobileNavItem
        href='/support'
        translationKey='nav.support'
        icon={<MessageCircle className='h-4 w-4' />}
        onClick={onItemClick}
      />
    </div>
  );
};
