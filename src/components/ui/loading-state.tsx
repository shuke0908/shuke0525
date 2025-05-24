import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingState({
  message = 'Loading data...',
  className = 'h-48',
  size = 'md',
}: LoadingStateProps) {
  const getLoaderSize = () => {
    switch (size) {
      case 'sm':
        return 'h-4 w-4';
      case 'lg':
        return 'h-12 w-12';
      default:
        return 'h-8 w-8';
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <Loader2
        className={`${getLoaderSize()} animate-spin text-primary mb-2`}
      />
      <p className='text-sm text-muted-foreground'>{message}</p>
    </div>
  );
}
