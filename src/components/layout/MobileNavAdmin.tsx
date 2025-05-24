import React from 'react';
import { Link } from 'wouter';
import { useTranslation } from 'react-i18next';
import {
  UserIcon,
  Wallet,
  ShieldCheck,
  Settings,
  BarChart3,
} from 'lucide-react';

interface MobileNavAdminItemProps {
  href: string;
  translationKey: string;
  icon: React.ReactNode;
  onClick?: (() => void) | undefined;
}

export const MobileNavAdminItem: React.FC<MobileNavAdminItemProps> = ({
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
      className='flex items-center gap-3 text-foreground hover:text-primary transition-colors mb-4'
    >
      <div className='flex-shrink-0'>{icon}</div>
      <span>{t(translationKey)}</span>
    </Link>
  );
};

interface MobileNavAdminItemsProps {
  onItemClick?: () => void;
}

export const MobileNavAdminItems: React.FC<MobileNavAdminItemsProps> = ({
  onItemClick,
}) => {
  const { t } = useTranslation();

  return (
    <div className='border-t pt-4'>
      <div className='font-medium mb-3'>{t('nav.adminPanel')}</div>
      <div className='flex flex-col'>
        <MobileNavAdminItem
          href='/admin'
          translationKey='nav.dashboard'
          icon={<BarChart3 className='h-5 w-5' />}
          onClick={onItemClick}
        />
        <MobileNavAdminItem
          href='/admin/users'
          translationKey='nav.users'
          icon={<UserIcon className='h-5 w-5' />}
          onClick={onItemClick}
        />
        <MobileNavAdminItem
          href='/admin/deposits'
          translationKey='nav.deposits'
          icon={<Wallet className='h-5 w-5' />}
          onClick={onItemClick}
        />
        <MobileNavAdminItem
          href='/admin/withdrawals'
          translationKey='nav.withdrawals'
          icon={<Wallet className='h-5 w-5' />}
          onClick={onItemClick}
        />
        <MobileNavAdminItem
          href='/admin/kyc'
          translationKey='nav.kycVerification'
          icon={<ShieldCheck className='h-5 w-5' />}
          onClick={onItemClick}
        />
        <MobileNavAdminItem
          href='/admin/settings'
          translationKey='nav.settings'
          icon={<Settings className='h-5 w-5' />}
          onClick={onItemClick}
        />
      </div>
    </div>
  );
};
