import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  retryAction?: () => void;
  retryLabel?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ErrorState({
  title = 'Error Loading Data',
  message = 'There was a problem loading the data. Please try again.',
  retryAction,
  retryLabel = 'Try Again',
  className = 'h-48',
  size = 'md',
}: ErrorStateProps) {
  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'h-6 w-6';
      case 'lg':
        return 'h-20 w-20';
      default:
        return 'h-12 w-12';
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <AlertTriangle className={`${getIconSize()} text-destructive mb-4`} />
      <h2 className='text-xl font-semibold mb-2'>{title}</h2>
      <p className='text-muted-foreground text-center max-w-md mb-4'>
        {message}
      </p>
      {retryAction && <Button onClick={retryAction}>{retryLabel}</Button>}
    </div>
  );
}
