import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  actionOnClick?: () => void;
  className?: string;
  children?: ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionOnClick,
  className = 'h-48',
  children,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${className}`}
    >
      {Icon && <Icon className='h-12 w-12 text-muted-foreground mb-4' />}
      <h3 className='text-lg font-medium mb-2'>{title}</h3>
      {description && (
        <p className='text-sm text-muted-foreground max-w-md mb-4'>
          {description}
        </p>
      )}
      {actionLabel && actionOnClick && (
        <Button onClick={actionOnClick}>{actionLabel}</Button>
      )}
      {children}
    </div>
  );
}
