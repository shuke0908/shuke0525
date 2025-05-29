import { cn } from '@/lib/utils';

interface LoadingProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export function Loading({ className, size = 'md', text = 'Loading...' }: LoadingProps) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={cn('flex items-center justify-center min-h-screen', className)}>
      <div className="flex flex-col items-center space-y-4">
        <div className={cn('animate-spin rounded-full border-2 border-gray-300 border-t-blue-600', sizes[size])} />
        {text && <p className="text-sm text-muted-foreground">{text}</p>}
      </div>
    </div>
  );
}

export default Loading; 