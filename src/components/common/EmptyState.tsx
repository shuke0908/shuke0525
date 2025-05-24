'use client';

import React from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { LucideIcon } from 'lucide-react';

export interface EmptyStateProps {
  title: string;
  description?: string | undefined;
  icon?: LucideIcon | undefined;
  action?:
    | {
        label: string;
        onClick: () => void;
        variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | undefined;
      }
    | undefined;
  children?: ReactNode | undefined;
  className?: string | undefined;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: {
    container: 'py-8',
    icon: 'w-8 h-8',
    title: 'text-lg',
    description: 'text-sm',
  },
  md: {
    container: 'py-12',
    icon: 'w-12 h-12',
    title: 'text-xl',
    description: 'text-base',
  },
  lg: {
    container: 'py-16',
    icon: 'w-16 h-16',
    title: 'text-2xl',
    description: 'text-lg',
  },
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  children,
  className,
  size = 'md',
}: EmptyStateProps) {
  const classes = sizeClasses[size];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        classes.container,
        className
      )}
    >
      {Icon && (
        <div className={cn('text-gray-400 mb-4', classes.icon)}>
          <Icon className='w-full h-full' />
        </div>
      )}

      <h3 className={cn('font-semibold text-gray-900 mb-2', classes.title)}>
        {title}
      </h3>

      {description && (
        <p className={cn('text-gray-600 mb-6 max-w-md', classes.description)}>
          {description}
        </p>
      )}

      {action && (
        <Button
          onClick={action.onClick}
          variant={action.variant || 'default'}
          className='mb-4'
        >
          {action.label}
        </Button>
      )}

      {children}
    </div>
  );
}

export default EmptyState;
