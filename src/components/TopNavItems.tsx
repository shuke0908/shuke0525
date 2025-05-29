import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

interface TopNavItemProps {
  href: string;
  translationKey: string;
}

export const TopNavItem: React.FC<TopNavItemProps> = ({
  href,
  translationKey,
}) => {
  const { t } = useTranslation();

  return (
    <Link
      href={href}
      className='text-sm font-medium text-muted-foreground hover:text-primary transition-colors'
    >
      {t(translationKey)}
    </Link>
  );
};

export const TopNavItems: React.FC = () => {
  return (
    <>
      <TopNavItem href='/dashboard' translationKey='nav.dashboard' />
      <TopNavItem href='/quick-trade' translationKey='nav.quickTrade' />
      <TopNavItem href='/flash-trade' translationKey='nav.flashTrade' />
      <TopNavItem href='/quant-ai' translationKey='nav.quantAI' />
      <TopNavItem href='/wallet' translationKey='nav.wallet' />
      <TopNavItem href='/crypto-converter' translationKey='nav.converter' />
      <TopNavItem href='/bonuses' translationKey='nav.bonuses' />
    </>
  );
};
