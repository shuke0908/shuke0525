'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
  fullScreen?: boolean;
  variant?: 'default' | 'primary' | 'secondary';
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

const textSizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
};

const variantClasses = {
  default: 'text-gray-500',
  primary: 'text-blue-600',
  secondary: 'text-gray-400',
};

export function LoadingSpinner({
  size = 'md',
  className,
  text,
  fullScreen = false,
  variant = 'default',
}: LoadingSpinnerProps) {
  const spinnerContent = (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2',
        fullScreen ? 'min-h-screen' : 'py-8',
        className
      )}
    >
      <Loader2
        className={cn(
          'animate-spin',
          sizeClasses[size],
          variantClasses[variant]
        )}
      />
      {text && (
        <p
          className={cn(
            'text-center font-medium',
            textSizeClasses[size],
            variantClasses[variant]
          )}
        >
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className='fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center'>
        {spinnerContent}
      </div>
    );
  }

  return spinnerContent;
}

// 인라인 스피너 (텍스트와 함께 한 줄에 표시)
export function InlineSpinner({
  size = 'sm',
  className,
  variant = 'default',
}: Pick<LoadingSpinnerProps, 'size' | 'className' | 'variant'>) {
  return (
    <Loader2
      className={cn(
        'animate-spin inline',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    />
  );
}

// 버튼 내부용 스피너
export function ButtonSpinner({
  size = 'sm',
  className,
}: Pick<LoadingSpinnerProps, 'size' | 'className'>) {
  return (
    <Loader2
      className={cn(
        'animate-spin',
        sizeClasses[size],
        'text-current',
        className
      )}
    />
  );
}

export default LoadingSpinner;
