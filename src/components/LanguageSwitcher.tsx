import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { languages } from '@/lib/i18n';
import Image from 'next/image';

// Flag icon component
const FlagIcon = ({ flagCode }: { flagCode: string }) => {
  return (
    <Image
      src={`/flags/${flagCode}.svg`}
      alt=''
      width={16}
      height={12}
      className='h-4 w-6 rounded-sm object-cover mr-2'
    />
  );
};

export function LanguageSwitcher({
  variant = 'default',
  size = 'sm',
  className = '',
}: {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}) {
  const { i18n } = useTranslation();

  const handleLanguageChange = (language: string) => {
    i18n.changeLanguage(language);
  };

  // Get current language name
  const currentLanguage =
    languages.find(lang => lang.code === i18n.language) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={`flex items-center gap-2 ${className}`}
        >
          {currentLanguage?.flagCode && (
            <FlagIcon flagCode={currentLanguage.flagCode} />
          )}
          {size !== 'icon' && <span>{currentLanguage?.nativeName}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-48'>
        {languages.map(lang => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`flex items-center ${i18n.language === lang.code ? 'font-bold bg-primary/10' : ''}`}
          >
            {lang.flagCode && <FlagIcon flagCode={lang.flagCode} />}
            <div className='flex flex-col'>
              <span className='text-sm font-medium'>{lang.nativeName}</span>
              <span className='text-xs text-muted-foreground'>{lang.name}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Mini version for compact UIs like headers
export function MiniLanguageSwitcher({
  className = '',
}: {
  className?: string;
}) {
  const { i18n } = useTranslation();

  const handleLanguageChange = (language: string) => {
    i18n.changeLanguage(language);
  };

  // Get current language
  const currentLanguage =
    languages.find(lang => lang.code === i18n.language) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          size='sm'
          className={`flex items-center px-2 ${className}`}
        >
          {currentLanguage?.flagCode && (
            <FlagIcon flagCode={currentLanguage.flagCode} />
          )}
          <span className='text-xs ml-1'>{currentLanguage?.nativeName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-48'>
        {languages.map(lang => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`flex items-center ${i18n.language === lang.code ? 'font-bold bg-primary/10' : ''}`}
          >
            {lang.flagCode && <FlagIcon flagCode={lang.flagCode} />}
            <div className='flex flex-col'>
              <span className='text-sm font-medium'>{lang.nativeName}</span>
              <span className='text-xs text-muted-foreground'>{lang.name}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
